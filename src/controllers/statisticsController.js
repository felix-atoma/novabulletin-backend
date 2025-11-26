const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Class = require('../models/Classroom');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { calculateStudentStatistics, calculateClassStatistics, calculateSubjectStatistics } = require('../services/statisticsCalculator');

exports.getStudentStatistics = async (req, res) => {
  try {
    const { studentId, trimester } = req.params;

    const statistics = await calculateStudentStatistics(studentId, trimester);

    res.status(200).json({
      status: 'success',
      data: {
        statistics
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getClassStatistics = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    const statistics = await calculateClassStatistics(classId, trimester);

    res.status(200).json({
      status: 'success',
      data: {
        statistics
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getSubjectStatistics = async (req, res) => {
  try {
    const { subjectId, classId, trimester } = req.params;

    const statistics = await calculateSubjectStatistics(subjectId, classId, trimester);

    res.status(200).json({
      status: 'success',
      data: {
        statistics
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getRanking = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    const classObj = await Class.findById(classId);
    const students = await Student.find({ class: classId });

    const ranking = await Promise.all(
      students.map(async (student) => {
        const stats = await calculateStudentStatistics(student._id, trimester);
        return {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            studentId: student.studentId
          },
          average: stats.average,
          rank: stats.rank
        };
      })
    );

    ranking.sort((a, b) => b.average - a.average);
    
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.status(200).json({
      status: 'success',
      data: {
        ranking
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getSchoolRanking = async (req, res) => {
  try {
    const { level, trimester } = req.params;
    const schoolId = req.user.school;

    // Find all classes for this level and school
    const classes = await Class.find({ 
      school: schoolId,
      level: level 
    });

    const classIds = classes.map(c => c._id);

    // Get all students in these classes
    const students = await Student.find({ 
      class: { $in: classIds } 
    }).populate('class', 'name');

    const ranking = await Promise.all(
      students.map(async (student) => {
        const stats = await calculateStudentStatistics(student._id, trimester);
        return {
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            studentId: student.studentId,
            class: student.class
          },
          average: stats.average || 0
        };
      })
    );

    // Sort by average descending
    ranking.sort((a, b) => b.average - a.average);
    
    // Assign ranks
    ranking.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.status(200).json({
      status: 'success',
      results: ranking.length,
      data: {
        level,
        trimester,
        ranking
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const schoolId = req.user.school;

    const totalStudents = await Student.countDocuments({ school: schoolId });
    const totalClasses = await Class.countDocuments({ school: schoolId });
    
    const studentsByLevel = await Student.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const recentGrades = await Grade.find()
      .populate('student', 'firstName lastName')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalStudents,
      totalClasses,
      studentsByLevel,
      recentActivity: recentGrades
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAdvancedSchoolStats = async (req, res) => {
  try {
    const schoolId = req.user.school;

    // Total counts
    const totalStudents = await Student.countDocuments({ school: schoolId });
    const totalClasses = await Class.countDocuments({ school: schoolId });
    const totalTeachers = await Teacher.countDocuments({ school: schoolId });

    // Students by level
    const studentsByLevel = await Student.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    // Average grades by level
    const gradesByLevel = await Grade.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      { $match: { 'studentInfo.school': schoolId } },
      {
        $group: {
          _id: '$studentInfo.level',
          averageGrade: { $avg: '$scores.note' },
          totalGrades: { $sum: 1 }
        }
      }
    ]);

    // Grades distribution
    const gradesDistribution = await Grade.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      { $match: { 'studentInfo.school': schoolId, 'scores.note': { $ne: null } } },
      {
        $bucket: {
          groupBy: '$scores.note',
          boundaries: [0, 5, 10, 12, 14, 16, 18, 20],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const stats = {
      overview: {
        totalStudents,
        totalClasses,
        totalTeachers
      },
      studentsByLevel,
      gradesByLevel,
      gradesDistribution
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getTeacherStats = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .populate('subjects', 'name code');

    if (!teacher) {
      return res.status(404).json({
        status: 'error',
        message: 'Enseignant non trouvé'
      });
    }

    // Classes taught
    const classes = await Class.find({ teacher: teacherId });

    // Total students
    const totalStudents = await Student.countDocuments({ 
      class: { $in: classes.map(c => c._id) } 
    });

    // Grades given by this teacher
    const gradesGiven = await Grade.countDocuments({ teacher: teacherId });

    // Average of grades given
    const avgGradesResult = await Grade.aggregate([
      { $match: { teacher: teacherId, 'scores.note': { $ne: null } } },
      {
        $group: {
          _id: null,
          averageGrade: { $avg: '$scores.note' },
          minGrade: { $min: '$scores.note' },
          maxGrade: { $max: '$scores.note' }
        }
      }
    ]);

    const avgGrades = avgGradesResult[0] || { 
      averageGrade: 0, 
      minGrade: 0, 
      maxGrade: 0 
    };

    // Grades by subject
    const gradesBySubject = await Grade.aggregate([
      { $match: { teacher: teacherId, 'scores.note': { $ne: null } } },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $group: {
          _id: '$subjectInfo.name',
          averageGrade: { $avg: '$scores.note' },
          totalGrades: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      teacher: {
        _id: teacher._id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        subjects: teacher.subjects
      },
      overview: {
        classesCount: classes.length,
        totalStudents,
        gradesGiven
      },
      gradeStats: avgGrades,
      gradesBySubject
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.exportClassStatistics = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    const classObj = await Class.findById(classId)
      .populate('teacher', 'firstName lastName');

    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    const students = await Student.find({ class: classId })
      .sort('lastName firstName');

    const exportData = await Promise.all(
      students.map(async (student) => {
        const grades = await Grade.find({
          student: student._id,
          trimester
        }).populate('subject', 'name');

        const stats = await calculateStudentStatistics(student._id, trimester);

        return {
          studentId: student.studentId,
          lastName: student.lastName,
          firstName: student.firstName,
          average: stats.average || 0,
          rank: stats.rank || 'N/A',
          totalSubjects: grades.length,
          grades: grades.map(g => ({
            subject: g.subject.name,
            note: g.scores.note,
            appreciation: g.scores.appreciation
          }))
        };
      })
    );

    // Sort by rank
    exportData.sort((a, b) => {
      if (a.rank === 'N/A') return 1;
      if (b.rank === 'N/A') return -1;
      return a.rank - b.rank;
    });

    res.status(200).json({
      status: 'success',
      data: {
        class: {
          name: classObj.name,
          level: classObj.level,
          teacher: classObj.teacher
        },
        trimester,
        students: exportData,
        exportDate: new Date()
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};