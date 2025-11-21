// src/controllers/classController.js
const Class = require('../models/Classroom');
const Student = require('../models/Student');

exports.getAllClasses = async (req, res) => {
  try {
    const { level, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }
    if (level) filter.level = level;

    const classes = await Class.find(filter)
      .populate('teacher', 'firstName lastName email')
      .populate('subjects', 'name code coefficient')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ level: 1, name: 1 });

    const total = await Class.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: {
        classes,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('teacher', 'firstName lastName email')
      .populate('subjects', 'name code coefficient')
      .populate('school', 'name');

    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    const students = await Student.find({ class: req.params.id })
      .select('firstName lastName studentId gender')
      .sort({ firstName: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        class: classObj,
        students
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name, level, grade, teacher, capacity, subjects, academicYear } = req.body;

    // Use school from user or request body
    const schoolId = req.user?.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({
        status: 'error',
        message: 'School ID is required'
      });
    }

    const classObj = await Class.create({
      name,
      level,
      grade,
      teacher: teacher || null,
      school: schoolId,
      capacity: capacity || 40,
      subjects: subjects || [],
      academicYear: academicYear || '2024-2025'
    });

    res.status(201).json({
      status: 'success',
      data: {
        class: classObj
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const classObj = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        class: classObj
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Classe supprimée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getClassStudents = async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.id })
      .populate('parents.parent', 'firstName lastName email')
      .select('studentId firstName lastName dateOfBirth gender level')
      .sort({ firstName: 1 });

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: {
        students
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getClassSubjects = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id).populate('subjects');
    
    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subjects: classObj.subjects
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add missing method for class statistics
exports.getClassStatistics = async (req, res) => {
  try {
    const { id, trimester } = req.params;
    
    // Mock statistics for now
    const statistics = {
      classAverage: 14.5,
      highestGrade: 18.5,
      lowestGrade: 8.0,
      studentsCount: 25,
      successRate: 85,
      trimester: trimester
    };

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