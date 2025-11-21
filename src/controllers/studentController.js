// src/controllers/studentController.js
const Student = require('../models/Student');

// @desc    Get all students
// @route   GET /api/v1/students
// @access  Private (Admin, Director, Teacher)
const getAllStudents = async (req, res) => {
  try {
    const { class: classId, level, isActive, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    // Filter by class if provided
    if (classId) {
      filter.class = classId;
    }
    
    // Filter by level if provided
    if (level) {
      filter.level = level;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const students = await Student.find(filter)
      .populate('class', 'name level')
      .populate('parents.parent', 'firstName lastName email phone')
      .populate('school', 'name')
      .sort({ firstName: 1, lastName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/v1/students/:id
// @access  Private (Parent with payment, Admin, Director, Teacher)
const getStudent = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    const student = await Student.findOne(filter)
      .populate('class', 'name level')
      .populate('parents.parent', 'firstName lastName email phone address')
      .populate('school', 'name address phone');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
};

// @desc    Create student
// @route   POST /api/v1/students
// @access  Private (Admin, Director, Teacher)
const createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      photo,
      class: studentClass,
      level,
      series,
      parents,
      enrollmentDate,
      school
    } = req.body;

    // Use school from body or user's school
    const schoolId = school || (req.user ? req.user.school : null);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID is required'
      });
    }

    // Generate student ID
    const schoolCode = schoolId.toString().slice(-4).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const studentId = `STU${schoolCode}${randomNum}`;

    // Check if student already exists with same name and school
    const existingStudent = await Student.findOne({
      firstName,
      lastName,
      school: schoolId
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this name already exists in this school'
      });
    }

    const student = await Student.create({
      studentId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      photo,
      school: schoolId,
      class: studentClass,
      level,
      series: level === 'lycee' ? series : null,
      parents: parents || [],
      enrollmentDate: enrollmentDate || Date.now(),
      isActive: true
    });

    await student.populate('class', 'name level');
    await student.populate('parents.parent', 'firstName lastName email');
    await student.populate('school', 'name');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
};

// @desc    Update student
// @route   PATCH /api/v1/students/:id
// @access  Private (Admin, Director, Teacher)
const updateStudent = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    const student = await Student.findOneAndUpdate(
      filter, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('class', 'name level')
    .populate('parents.parent', 'firstName lastName email')
    .populate('school', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// @desc    Delete student (soft delete by setting isActive to false)
// @route   DELETE /api/v1/students/:id
// @access  Private (Admin, Director only)
const deleteStudent = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    const student = await Student.findOne(filter);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete by setting isActive to false
    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deactivated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating student',
      error: error.message
    });
  }
};

// @desc    Get student grades
// @route   GET /api/v1/students/:id/grades/:trimester
// @access  Private (Parent with payment, Admin, Director, Teacher)
const getStudentGrades = async (req, res) => {
  try {
    const { id, trimester } = req.params;
    
    // Verify student exists
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Mock grades response
    const mockGrades = generateMockGrades(student.level, parseInt(trimester));

    res.status(200).json({
      success: true,
      message: `Grades for student ${student.studentId}, trimester ${trimester}`,
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          fullName: `${student.firstName} ${student.lastName}`,
          class: student.class,
          level: student.level
        },
        trimester: parseInt(trimester),
        grades: mockGrades.grades,
        summary: mockGrades.summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student grades',
      error: error.message
    });
  }
};

// @desc    Get student bulletins
// @route   GET /api/v1/students/:id/bulletins
// @access  Private (Parent with payment, Admin, Director, Teacher)
const getStudentBulletins = async (req, res) => {
  try {
    const { id } = req.params;
    const { trimester, schoolYear } = req.query;
    
    // Verify student exists
    const student = await Student.findById(id)
    .populate('class', 'name level');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Mock bulletins response
    const mockBulletins = generateMockBulletins(student, trimester, schoolYear);

    res.status(200).json({
      success: true,
      message: `Bulletins for student ${student.studentId}`,
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          fullName: `${student.firstName} ${student.lastName}`,
          class: student.class
        },
        bulletins: mockBulletins,
        total: mockBulletins.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student bulletins',
      error: error.message
    });
  }
};

// @desc    Get students by class
// @route   GET /api/v1/students/class/:classId
// @access  Private (Admin, Director, Teacher)
const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { isActive = true } = req.query;
    
    const filter = { 
      class: classId,
      isActive: isActive === 'true'
    };

    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    const students = await Student.find(filter)
      .populate('parents.parent', 'firstName lastName email phone')
      .select('studentId firstName lastName dateOfBirth gender level photo isActive')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching class students',
      error: error.message
    });
  }
};

// @desc    Update student status
// @route   PATCH /api/v1/students/:id/status
// @access  Private (Admin, Director only)
const updateStudentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const filter = { _id: req.params.id };
    
    // Add school filter if user has school
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }

    const student = await Student.findOneAndUpdate(
      filter,
      { isActive },
      { new: true, runValidators: true }
    )
    .populate('class', 'name level')
    .populate('parents.parent', 'firstName lastName email')
    .populate('school', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const statusText = isActive ? 'activated' : 'deactivated';
    
    res.status(200).json({
      success: true,
      message: `Student ${statusText} successfully`,
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating student status',
      error: error.message
    });
  }
};

// Helper functions
function generateMockGrades(level, trimester) {
  const subjects = getSubjectsByLevel(level);
  
  const grades = subjects.map(subject => ({
    subject: subject.name,
    grade: parseFloat((Math.random() * 10 + 8).toFixed(2)),
    coefficient: subject.coefficient,
    comment: getRandomComment(),
    trimester: trimester,
    evaluationDate: new Date()
  }));

  const totalCoefficient = grades.reduce((sum, grade) => sum + grade.coefficient, 0);
  const weightedSum = grades.reduce((sum, grade) => sum + (grade.grade * grade.coefficient), 0);
  const average = parseFloat((weightedSum / totalCoefficient).toFixed(2));

  return {
    grades,
    summary: {
      average,
      classAverage: parseFloat((average - 1 + Math.random() * 2).toFixed(2)),
      ranking: Math.floor(Math.random() * 25) + 1,
      totalStudents: 25,
      appreciation: getAppreciation(average)
    }
  };
}

function generateMockBulletins(student, trimester, schoolYear) {
  const bulletins = [];
  const trimesters = trimester ? [parseInt(trimester)] : [1, 2, 3];
  
  trimesters.forEach(tri => {
    const gradesData = generateMockGrades(student.level, tri);
    bulletins.push({
      trimester: tri,
      schoolYear: schoolYear || '2024-2025',
      student: student._id,
      overallAverage: gradesData.summary.average,
      classAverage: gradesData.summary.classAverage,
      ranking: gradesData.summary.ranking,
      teacherComment: `Good performance in trimester ${tri}`,
      principalComment: 'Continue your efforts',
      grades: gradesData.grades,
      published: tri < 3,
      publishDate: tri < 3 ? new Date() : null
    });
  });

  return bulletins;
}

function getSubjectsByLevel(level) {
  const commonSubjects = [
    { name: 'French', coefficient: 3 },
    { name: 'Mathematics', coefficient: 3 },
    { name: 'History-Geography', coefficient: 2 }
  ];

  switch (level) {
    case 'college':
      return [
        ...commonSubjects,
        { name: 'English', coefficient: 2 },
        { name: 'Science', coefficient: 2 },
        { name: 'Arts', coefficient: 1 }
      ];
    case 'lycee':
      return [
        ...commonSubjects,
        { name: 'English', coefficient: 2 },
        { name: 'Physics-Chemistry', coefficient: 3 },
        { name: 'Biology', coefficient: 2 },
        { name: 'Philosophy', coefficient: 2 }
      ];
    case 'primaire':
      return [
        { name: 'Reading', coefficient: 3 },
        { name: 'Writing', coefficient: 3 },
        { name: 'Mathematics', coefficient: 3 },
        { name: 'Discovery of the World', coefficient: 1 }
      ];
    default:
      return commonSubjects;
  }
}

function getRandomComment() {
  const comments = [
    'Good work',
    'Could do better',
    'Excellent performance',
    'Shows improvement',
    'Needs to practice more',
    'Very diligent student'
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function getAppreciation(average) {
  if (average >= 16) return 'Excellent';
  if (average >= 14) return 'Very Good';
  if (average >= 12) return 'Good';
  if (average >= 10) return 'Satisfactory';
  return 'Needs Improvement';
}

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentGrades,
  getStudentBulletins,
  getClassStudents,
  updateStudentStatus
};