const Subject = require('../models/Subject');

// Togolese education system coefficients
const TOGOLESE_COEFFICIENTS = {
  maternelle: {},
  primaire: {
    all: {
      'Français': 1,
      'Mathématiques': 1,
      'Sciences': 1,
      'Histoire-Géographie': 1,
      'Éducation Civique et Morale': 1,
      'Anglais': 1,
      'EPS': 1
    }
  },
  college: {
    '6e': { all: 1 },
    '5e': { all: 1 },
    '4e': { all: 1 },
    '3e': { 'Mathématiques': 2, 'default': 1 }
  },
  seconde: { /* lycée data */ },
  premiere: { /* lycée data */ },
  terminale: { /* lycée data */ }
};

// Helper function to get coefficient
const getSubjectCoefficient = (subjectName, level, seriesOrGrade) => {
  const levelData = TOGOLESE_COEFFICIENTS[level];
  if (!levelData) return 1;

  if (level === 'college') {
    const gradeData = levelData[seriesOrGrade];
    if (!gradeData) return 1;
    if (gradeData.all) return gradeData.all;
    return gradeData[subjectName] || gradeData.default || 1;
  }

  if (level === 'primaire') {
    return levelData.all?.[subjectName] || 1;
  }

  // Lycée
  const seriesData = levelData[seriesOrGrade];
  if (!seriesData) return 1;
  return seriesData[subjectName] || 1;
};

// GET all subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const { level, series, grade, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (level) filter.level = level;
    if (series) filter.series = { $in: [series, 'all'] };
    if (grade) filter.applicableGrades = { $in: [grade, 'all'] };

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
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// CREATE a subject
exports.createSubject = async (req, res) => {
  try {
    const { name, code, level, series, applicableGrades, isMain, evaluationType, coefficient } = req.body;

    if (!name || !code || !level)
      return res.status(400).json({ status: 'error', message: 'name, code, and level are required' });

    let calcCoefficient = coefficient;

    if (!coefficient) {
      if (['seconde','premiere','terminale'].includes(level) && series) {
        calcCoefficient = getSubjectCoefficient(name, level, series);
      } else if (level === 'college' && applicableGrades?.[0]) {
        calcCoefficient = getSubjectCoefficient(name, level, applicableGrades[0]);
      } else {
        calcCoefficient = 1;
      }
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      level,
      coefficient: calcCoefficient,
      series: series || ['all'],
      applicableGrades: applicableGrades || ['all'],
      isMain: isMain ?? true,
      evaluationType: evaluationType || 'notes',
      school: req.user?.school
    });

    res.status(201).json({
      status: 'success',
      message: 'Matière créée avec succès',
      data: { subject }
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ status: 'error', message: 'Une matière avec ce code existe déjà' });

    res.status(400).json({ status: 'error', message: error.message });
  }
};

// GET single subject
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });

    res.status(200).json({ status: 'success', data: { subject } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// UPDATE subject
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });

    res.status(200).json({ status: 'success', message: 'Matière mise à jour avec succès', data: { subject } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// DELETE subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });

    res.status(200).json({ status: 'success', message: 'Matière supprimée avec succès' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// GET subjects by class
exports.getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const Class = require('../models/Classroom');
    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ status: 'error', message: 'Classe non trouvée' });

    const { level, grade, series } = classData;

    const query = { level };
    if (series && series !== 'all') query.series = { $in: [series, 'all'] };
    if (grade && grade !== 'all') query.applicableGrades = { $in: [grade, 'all'] };

    const subjects = await Subject.find(query).sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: subjects.length,
      data: { subjects, classInfo: { name: classData.name, level, grade, series } }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// BULK create subjects
exports.bulkCreateSubjects = async (req, res) => {
  try {
    const { level, series, grade } = req.body;
    if (!level) return res.status(400).json({ status: 'error', message: 'level is required' });

    let coefficientData = {};
    if (level === 'college' && grade) coefficientData = TOGOLESE_COEFFICIENTS.college[grade];
    else if (['seconde','premiere','terminale'].includes(level) && series) coefficientData = TOGOLESE_COEFFICIENTS[level]?.[series];
    else if (level === 'primaire') coefficientData = TOGOLESE_COEFFICIENTS.primaire.all;

    if (!coefficientData || Object.keys(coefficientData).length === 0)
      return res.status(400).json({ status: 'error', message: 'Configuration non trouvée pour ce niveau/série' });

    const subjects = Object.entries(coefficientData)
      .filter(([name]) => name !== 'all' && name !== 'default')
      .map(([name, coef]) => ({
        name,
        code: (name.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase()),
        level,
        series: series ? [series] : ['all'],
        applicableGrades: grade ? [grade] : ['all'],
        coefficient: coef,
        isMain: true,
        evaluationType: 'notes',
        school: req.user?.school
      }));

    const createdSubjects = await Subject.insertMany(subjects, { ordered: false });

    res.status(201).json({
      status: 'success',
      message: `${createdSubjects.length} matières créées avec succès`,
      data: { subjects: createdSubjects, count: createdSubjects.length }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(207).json({
        status: 'partial_success',
        message: 'Certaines matières existent déjà',
        data: { inserted: error.insertedDocs?.length || 0 }
      });
    }
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// GET coefficient reference
exports.getCoefficientReference = async (req, res) => {
  try {
    const { level, series, grade } = req.query;

    let data = {};
    if (level === 'college' && grade) data = TOGOLESE_COEFFICIENTS.college[grade];
    else if (['seconde','premiere','terminale'].includes(level) && series) data = TOGOLESE_COEFFICIENTS[level]?.[series];
    else if (level === 'primaire') data = TOGOLESE_COEFFICIENTS.primaire.all;
    else data = TOGOLESE_COEFFICIENTS[level] || {};

    res.status(200).json({ status: 'success', data: { level, series, grade, coefficients: data } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
