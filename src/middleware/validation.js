// src/middleware/validation.js
const Joi = require('joi');

exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Format d\'email invalide',
      'any.required': 'L\'email est obligatoire'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le mot de passe est obligatoire'
    }),
    firstName: Joi.string().min(2).required().messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'any.required': 'Le prénom est obligatoire'
    }),
    lastName: Joi.string().min(2).required().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'any.required': 'Le nom est obligatoire'
    }),
    role: Joi.string().valid('admin', 'director', 'teacher', 'parent', 'student').required().messages({
      'any.only': 'Rôle invalide. Les rôles valides sont: admin, director, teacher, parent, student',
      'any.required': 'Le rôle est obligatoire'
    }),
    phone: Joi.string().optional().allow(''),
    
    // Director-specific fields
    schoolName: Joi.when('role', {
      is: 'director',
      then: Joi.string().required().messages({
        'any.required': 'Le nom de l\'école est obligatoire pour les directeurs'
      }),
      otherwise: Joi.optional().allow('')
    }),
    city: Joi.when('role', {
      is: 'director',
      then: Joi.string().required().messages({
        'any.required': 'La ville est obligatoire pour les directeurs'
      }),
      otherwise: Joi.optional().allow('')
    }),
    address: Joi.when('role', {
      is: 'director',
      then: Joi.string().required().messages({
        'any.required': 'L\'adresse de l\'école est obligatoire pour les directeurs'
      }),
      otherwise: Joi.optional().allow('')
    }),
    
    // Teacher/Student/Parent - optional schoolId for linking to existing school
    schoolId: Joi.string().optional().allow(''),
    
    // Student-specific fields
    studentId: Joi.when('role', {
      is: 'student',
      then: Joi.string().optional().allow(''),
      otherwise: Joi.optional().allow('')
    }),
    
    // Teacher-specific fields
    teacherId: Joi.when('role', {
      is: 'teacher',
      then: Joi.string().optional().allow(''),
      otherwise: Joi.optional().allow('')
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

exports.validateGrade = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().required(),
    subjectId: Joi.string().required(),
    trimester: Joi.string().valid('first', 'second', 'third').required(),
    note: Joi.number().min(0).max(20).optional().allow(null),
    competence: Joi.string().valid('acquired', 'in_progress', 'not_acquired').optional().allow(null),
    appreciation: Joi.string().max(500).optional().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

exports.validateBulletin = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().required(),
    trimester: Joi.string().valid('first', 'second', 'third').required(),
    generalAppreciation: Joi.string().max(1000).optional().allow(''),
    teacherSignature: Joi.string().optional().allow(''),
    directorSignature: Joi.string().optional().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

exports.validatePayment = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().required(),
    amount: Joi.number().min(1000).required(),
    paymentMethod: Joi.string().valid('mobile_money', 'cash', 'bank_transfer').required(),
    phoneNumber: Joi.when('paymentMethod', {
      is: 'mobile_money',
      then: Joi.string().required(),
      otherwise: Joi.optional()
    }),
    mobileMoneyProvider: Joi.when('paymentMethod', {
      is: 'mobile_money',
      then: Joi.string().valid('mtn', 'moov', 'vodafone').required(),
      otherwise: Joi.optional()
    }),
    trimester: Joi.string().valid('first', 'second', 'third', 'annual').required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }

  next();
};

exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: `Accès réservé aux ${requiredRole}s et administrateurs`
      });
    }
    next();
  };
};

exports.requireSchoolAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (!req.user.school) {
    return res.status(403).json({
      status: 'error',
      message: 'Aucune école associée à votre compte'
    });
  }

  // Pour les directeurs, enseignants, parents - vérifier qu'ils appartiennent à la bonne école
  if (req.params.schoolId && req.params.schoolId !== req.user.school.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Accès non autorisé à cette école'
    });
  }

  next();
};

exports.canManageStudents = (req, res, next) => {
  const allowedRoles = ['admin', 'director', 'teacher'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Permission insuffisante pour gérer les élèves'
    });
  }
  next();
};

exports.canManageGrades = (req, res, next) => {
  const allowedRoles = ['admin', 'director', 'teacher'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Permission insuffisante pour gérer les notes'
    });
  }
  next();
};