const Grade = require('../models/grade');
const Student = require('../models/Student');
const Class = require('../models/Classroom');
const Statistics = require('../models/Statistics');

exports.calculateStudentStatistics = async (studentId, trimester) => {
  const grades = await Grade.find({
    student: studentId,
    trimester,
    'scores.note': { $ne: null }
  }).populate('subject');

  if (grades.length === 0) {
    return {
      average: 0,
      totalSubjects: 0,
      completedSubjects: 0,
      rank: 0,
      classAverage: 0,
      minScore: 0,
      maxScore: 0,
      mention: 'Non évalué'
    };
  }

  let totalPoints = 0;
  let totalCoefficients = 0;

  grades.forEach(grade => {
    if (grade.scores.note !== null) {
      totalPoints += grade.scores.note * grade.coefficient;
      totalCoefficients += grade.coefficient;
    }
  });

  const average = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

  const studentClass = await Class.findOne({ students: studentId });
  const classStudents = await Student.find({ class: studentClass._id });
  
  const classAverages = await Promise.all(
    classStudents.map(async (student) => {
      const studentGrades = await Grade.find({
        student: student._id,
        trimester,
        'scores.note': { $ne: null }
      }).populate('subject');

      let studentTotalPoints = 0;
      let studentTotalCoefficients = 0;

      studentGrades.forEach(grade => {
        if (grade.scores.note !== null) {
          studentTotalPoints += grade.scores.note * grade.coefficient;
          studentTotalCoefficients += grade.coefficient;
        }
      });

      return studentTotalCoefficients > 0 ? studentTotalPoints / studentTotalCoefficients : 0;
    })
  );

  const sortedAverages = [...classAverages].sort((a, b) => b - a);
  const rank = sortedAverages.indexOf(average) + 1;

  const classAverage = classAverages.reduce((a, b) => a + b, 0) / classAverages.length;
  const minScore = Math.min(...classAverages);
  const maxScore = Math.max(...classAverages);

  let mention = 'Passable';
  if (average >= 16) mention = 'Excellent';
  else if (average >= 14) mention = 'Très Bien';
  else if (average >= 12) mention = 'Bien';
  else if (average >= 10) mention = 'Assez Bien';

  const statistics = {
    average: parseFloat(average.toFixed(2)),
    totalSubjects: grades.length,
    completedSubjects: grades.filter(g => g.scores.note !== null).length,
    rank,
    classAverage: parseFloat(classAverage.toFixed(2)),
    minScore: parseFloat(minScore.toFixed(2)),
    maxScore: parseFloat(maxScore.toFixed(2)),
    mention
  };

  await Statistics.findOneAndUpdate(
    { student: studentId, trimester },
    statistics,
    { upsert: true }
  );

  return statistics;
};

exports.calculateClassStatistics = async (classId, trimester) => {
  const students = await Student.find({ class: classId });
  const grades = await Grade.find({
    class: classId,
    trimester
  }).populate('subject').populate('student');

  const studentStats = await Promise.all(
    students.map(student => this.calculateStudentStatistics(student._id, trimester))
  );

  const averages = studentStats.map(stat => stat.average);
  const classAverage = averages.reduce((a, b) => a + b, 0) / averages.length;

  return {
    totalStudents: students.length,
    classAverage: parseFloat(classAverage.toFixed(2)),
    minAverage: Math.min(...averages),
    maxAverage: Math.max(...averages),
    successRate: (averages.filter(avg => avg >= 10).length / averages.length) * 100,
    studentStats
  };
};

exports.calculateSubjectStatistics = async (subjectId, classId, trimester) => {
  const grades = await Grade.find({
    subject: subjectId,
    class: classId,
    trimester,
    'scores.note': { $ne: null }
  }).populate('student');

  const notes = grades.map(grade => grade.scores.note);
  
  if (notes.length === 0) {
    return {
      average: 0,
      minNote: 0,
      maxNote: 0,
      successRate: 0,
      totalStudents: 0,
      evaluatedStudents: 0
    };
  }

  const average = notes.reduce((a, b) => a + b, 0) / notes.length;
  const minNote = Math.min(...notes);
  const maxNote = Math.max(...notes);
  const successRate = (notes.filter(note => note >= 10).length / notes.length) * 100;

  const students = await Student.find({ class: classId });

  return {
    average: parseFloat(average.toFixed(2)),
    minNote: parseFloat(minNote.toFixed(2)),
    maxNote: parseFloat(maxNote.toFixed(2)),
    successRate: parseFloat(successRate.toFixed(2)),
    totalStudents: students.length,
    evaluatedStudents: notes.length
  };
};