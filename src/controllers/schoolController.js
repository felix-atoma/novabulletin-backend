const School = require('../models/School');
const User = require('../models/User');

// Remove these lines:
// const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');

// Create school (admin only)
exports.createSchool = async (req, res) => {
  try {
    console.log('📝 Creating school with data:', req.body);
    
    const school = await School.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        school
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get current user's school
exports.getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.user.school)
      .populate('director', 'firstName lastName email');

    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'École non trouvée'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { school }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get specific school by ID
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('director', 'firstName lastName email');

    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'School not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { school }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      phone: req.body.phone,
      email: req.body.email,
      logo: req.body.logo,
      levels: req.body.levels,
      academicYear: req.body.academicYear,
      'paymentConfig.primaryPrice': req.body.paymentConfig?.primaryPrice,
      'paymentConfig.collegePrice': req.body.paymentConfig?.collegePrice,
      'paymentConfig.highSchoolPrice': req.body.paymentConfig?.highSchoolPrice
    };

    const school = await School.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'School not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { school }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete school (admin only)
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);

    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'School not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all schools (admin only)
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().populate('director', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      results: schools.length,
      data: { schools }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// School statistics
exports.getSchoolStats = async (req, res) => {
  try {
    const schoolId = req.user.school;

    // Placeholder – to be replaced by real stats later
    const stats = {
      totalStudents: await User.countDocuments({ role: 'student', school: schoolId }),
      totalTeachers: await User.countDocuments({ role: 'teacher', school: schoolId }),
      totalClasses: 0, // TODO
      paymentRate: 0,  // TODO
      averageSuccessRate: 0 // TODO
    };

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};