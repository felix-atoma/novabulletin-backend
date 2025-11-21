const Student = require('../models/Student');
const Grade = require('../models/grade');

exports.calculateClassRanking = async (classId, trimester) => {
  const students = await Student.find({ class: classId });
  
  const studentAverages = await Promise.all(
    students.map(async (student) => {
      const grades = await Grade.find({
        student: student._id,
        trimester,
        'scores.note': { $ne: null }
      }).populate('subject');

      let totalPoints = 0;
      let totalCoefficients = 0;

      grades.forEach(grade => {
        if (grade.scores.note !== null) {
          totalPoints += grade.scores.note * grade.coefficient;
          totalCoefficients += grade.coefficient;
        }
      });

      const average = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
      
      return {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        average: parseFloat(average.toFixed(2))
      };
    })
  );

  studentAverages.sort((a, b) => b.average - a.average);

  return studentAverages.map((student, index) => ({
    ...student,
    rank: index + 1
  }));
};

exports.calculateSchoolRanking = async (schoolId, level, trimester) => {
  const classes = await Class.find({ school: schoolId, level });
  let allStudents = [];

  for (const classObj of classes) {
    const classRanking = await this.calculateClassRanking(classObj._id, trimester);
    allStudents = [...allStudents, ...classRanking];
  }

  allStudents.sort((a, b) => b.average - a.average);

  return allStudents.map((student, index) => ({
    ...student,
    schoolRank: index + 1
  }));
};