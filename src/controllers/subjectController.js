const Subject = require('../models/Subject');

exports.getAllSubjects = async (req, res) => {
  try {
    const { level, series, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (level) filter.level = level;
    if (series) filter.series = { $in: [series, 'all'] };

    const subjects = await Subject.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Subject.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: subjects.length,
      data: {
        subjects,
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

exports.createSubject = async (req, res) => {
  try {
    const { name, code, level, coefficient, series, isMain, evaluationType } = req.body;

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      level,
      coefficient: coefficient || 1,
      series: series || ['all'],
      isMain: isMain || false,
      evaluationType: evaluationType || 'notes',
      school: req.user.school
    });

    res.status(201).json({
      status: 'success',
      data: {
        subject
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Matière non trouvée'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subject
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};