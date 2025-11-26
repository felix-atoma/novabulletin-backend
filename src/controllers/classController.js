// src/controllers/classController.js
const Class = require('../models/Classroom');
const Student = require('../models/Student');
const User = require('../models/User');

exports.getAllClasses = async (req, res) => {
  try {
    const { level, series, page = 1, limit = 10, search, academicYear } = req.query;

    let filter = {};
    
    // Filtre par école
    if (req.user && req.user.school) {
      filter.school = req.user.school;
    }
    
    // Filtres optionnels
    if (level) filter.level = level;
    if (series) filter.series = series;
    if (academicYear) filter.academicYear = academicYear;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Recherche textuelle
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(filter)
      .populate('teacher', 'firstName lastName email phone')
      .populate('subjects', 'name code coefficient color')
      .populate('school', 'name address')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ level: 1, series: 1, name: 1 });

    const total = await Class.countDocuments(filter);

    // Calculer les statistiques pour chaque classe
    const classesWithStats = await Promise.all(
      classes.map(async (classObj) => {
        const studentCount = await Student.countDocuments({ 
          class: classObj._id, 
          isActive: true 
        });
        
        return {
          ...classObj.toObject(),
          studentCount,
          availableSpots: classObj.capacity - studentCount,
          occupancyRate: ((studentCount / classObj.capacity) * 100).toFixed(1)
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: {
        classes: classesWithStats,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Error in getAllClasses:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération des classes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('teacher', 'firstName lastName email phone avatar')
      .populate('subjects', 'name code coefficient color teacher')
      .populate('school', 'name address phone email');

    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    // Récupérer les élèves avec plus d'informations
    const students = await Student.find({ class: req.params.id, isActive: true })
      .populate('parents.parent', 'firstName lastName email phone')
      .select('firstName lastName studentId gender dateOfBirth email phone photo')
      .sort({ lastName: 1, firstName: 1 });

    // Statistiques de la classe
    const studentCount = students.length;
    const maleCount = students.filter(s => s.gender === 'male').length;
    const femaleCount = students.filter(s => s.gender === 'female').length;

    res.status(200).json({
      status: 'success',
      data: {
        class: classObj,
        students,
        statistics: {
          totalStudents: studentCount,
          maleStudents: maleCount,
          femaleStudents: femaleCount,
          availableSpots: classObj.capacity - studentCount,
          occupancyRate: ((studentCount / classObj.capacity) * 100).toFixed(1)
        }
      }
    });
  } catch (error) {
    console.error('Error in getClass:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération de la classe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name, level, series, teacher, capacity, subjects, academicYear, description } = req.body;

    // Validation des données
    if (!name || !level) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nom et le niveau sont obligatoires'
      });
    }

    // Validation des séries pour le lycée
    if (['2nde', '1ere', 'terminale'].includes(level) && !series) {
      return res.status(400).json({
        status: 'error',
        message: 'La série est obligatoire pour les niveaux lycée'
      });
    }

    // Vérifier si le professeur existe
    if (teacher) {
      const teacherExists = await User.findById(teacher);
      if (!teacherExists || teacherExists.role !== 'teacher') {
        return res.status(400).json({
          status: 'error',
          message: 'Professeur non trouvé ou non valide'
        });
      }
    }

    // Use school from user or request body
    const schoolId = req.user?.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({
        status: 'error',
        message: 'School ID is required'
      });
    }

    // Vérifier si une classe avec le même nom existe déjà pour cette année
    const existingClass = await Class.findOne({
      name,
      level,
      school: schoolId,
      academicYear: academicYear || '2024-2025'
    });

    if (existingClass) {
      return res.status(400).json({
        status: 'error',
        message: 'Une classe avec ce nom existe déjà pour cette année scolaire'
      });
    }

    const classObj = await Class.create({
      name,
      level,
      series: series || null,
      teacher: teacher || null,
      school: schoolId,
      capacity: capacity || 35,
      subjects: subjects || [],
      academicYear: academicYear || '2024-2025',
      description: description || ''
    });

    // Populer les données pour la réponse
    const populatedClass = await Class.findById(classObj._id)
      .populate('teacher', 'firstName lastName email')
      .populate('subjects', 'name code');

    res.status(201).json({
      status: 'success',
      message: 'Classe créée avec succès',
      data: {
        class: populatedClass
      }
    });
  } catch (error) {
    console.error('Error in createClass:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Données de validation invalides',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la création de la classe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { name, level, series, teacher, capacity, subjects, academicYear, description, isActive } = req.body;

    // Vérifier si la classe existe
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    // Validation des séries pour le lycée
    if (level && ['2nde', '1ere', 'terminale'].includes(level) && !series) {
      return res.status(400).json({
        status: 'error',
        message: 'La série est obligatoire pour les niveaux lycée'
      });
    }

    // Vérifier les conflits de nom
    if (name && name !== existingClass.name) {
      const duplicateClass = await Class.findOne({
        name,
        level: level || existingClass.level,
        school: existingClass.school,
        academicYear: academicYear || existingClass.academicYear,
        _id: { $ne: req.params.id }
      });

      if (duplicateClass) {
        return res.status(400).json({
          status: 'error',
          message: 'Une classe avec ce nom existe déjà pour cette année scolaire'
        });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        // S'assurer que la série est null pour les niveaux non-lycée
        series: (level && ['2nde', '1ere', 'terminale'].includes(level)) ? series : null
      },
      { new: true, runValidators: true }
    )
    .populate('teacher', 'firstName lastName email')
    .populate('subjects', 'name code coefficient');

    res.status(200).json({
      status: 'success',
      message: 'Classe mise à jour avec succès',
      data: {
        class: updatedClass
      }
    });
  } catch (error) {
    console.error('Error in updateClass:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Données de validation invalides',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la mise à jour de la classe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Vérifier s'il y a des élèves dans la classe
    const studentCount = await Student.countDocuments({ 
      class: req.params.id, 
      isActive: true 
    });

    if (studentCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Impossible de supprimer la classe. ${studentCount} élève(s) y sont encore inscrits.`
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Classe supprimée avec succès'
    });
  } catch (error) {
    console.error('Error in deleteClass:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la suppression de la classe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getClassStudents = async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.id, isActive: true })
      .populate('parents.parent', 'firstName lastName email phone')
      .select('studentId firstName lastName dateOfBirth gender email phone photo level series enrollmentDate')
      .sort({ lastName: 1, firstName: 1 });

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: {
        students
      }
    });
  } catch (error) {
    console.error('Error in getClassStudents:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération des élèves',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getClassSubjects = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('subjects', 'name code coefficient color teacher description');
    
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
    console.error('Error in getClassSubjects:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération des matières',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getClassStatistics = async (req, res) => {
  try {
    const { id, trimester } = req.params;
    
    const classObj = await Class.findById(id);
    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    // Statistiques des élèves
    const totalStudents = await Student.countDocuments({ class: id, isActive: true });
    const maleStudents = await Student.countDocuments({ class: id, gender: 'male', isActive: true });
    const femaleStudents = await Student.countDocuments({ class: id, gender: 'female', isActive: true });

    // Statistiques académiques (mock pour l'instant)
    const statistics = {
      classAverage: 14.5,
      highestGrade: 18.5,
      lowestGrade: 8.0,
      successRate: 85,
      trimester: trimester || '1',
      studentStatistics: {
        total: totalStudents,
        male: maleStudents,
        female: femaleStudents,
        availableSpots: classObj.capacity - totalStudents,
        occupancyRate: ((totalStudents / classObj.capacity) * 100).toFixed(1)
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        statistics
      }
    });
  } catch (error) {
    console.error('Error in getClassStatistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Nouvelle méthode pour obtenir les séries disponibles
exports.getAvailableSeries = async (req, res) => {
  try {
    const { level } = req.query;
    
    const series = ['A4', 'D', 'C', 'E', 'F', 'A2'];
    
    res.status(200).json({
      status: 'success',
      data: {
        series,
        forLevel: level
      }
    });
  } catch (error) {
    console.error('Error in getAvailableSeries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};