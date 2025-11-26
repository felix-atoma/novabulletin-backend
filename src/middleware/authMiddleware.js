const User = require('../models/User');
const School = require('../models/School');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const StudentRegistration = require('../models/StudentRegistration');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const jwtConfig = require('../config/jwt');

const signToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || jwtConfig.secret;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || jwtConfig.expiresIn;
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiresIn });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieExpiresDays = process.env.JWT_COOKIE_EXPIRES_IN || jwtConfig.cookieExpiresIn;
  
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

const generateUniqueId = async (prefix, model, idField) => {
  let unique = false;
  let newId;
  while (!unique) {
    newId = `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const existing = await model.findOne({ [idField]: newId });
    if (!existing) unique = true;
  }
  return newId;
};

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      schoolName,
      address,
      city,
      studentId,
      teacherId,
      schoolId
    } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    let school;

    if (role === 'director') {
      if (!schoolName || !schoolName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Le nom de l\'école est obligatoire pour les directeurs'
        });
      }
      if (!city || !city.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'La ville est obligatoire pour les directeurs'
        });
      }
      if (!phone || !phone.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Le téléphone est obligatoire pour les directeurs'
        });
      }
      if (!address || !address.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'L\'adresse est obligatoire pour les directeurs'
        });
      }

      const existingSchool = await School.findOne({ name: schoolName });
      if (existingSchool) {
        return res.status(400).json({
          status: 'error',
          message: 'Une école avec ce nom existe déjà'
        });
      }

      school = await School.create({
        name: schoolName,
        address: address,
        city: city,
        phone: phone,
        email: email,
        country: 'Togo'
      });
    } else if (schoolId) {
      const found = await School.findById(schoolId);
      if (!found) {
        return res.status(400).json({
          status: 'error',
          message: 'École introuvable (schoolId invalide)'
        });
      }
      school = found;
    }

    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone: phone || '',
      school: school ? school._id : undefined
    });

    if (role === 'director' && school) {
      await School.findByIdAndUpdate(school._id, { director: newUser._id });
      newUser.registrationStatus = 'approved';
      newUser.isActive = true;
      await newUser.save();
    }

    if (role === 'parent') {
      const parentPayload = {
        user: newUser._id,
        phone: phone || '',
        address: address || 'Non spécifié'
      };
      if (school) parentPayload.school = school._id;
      
      await Parent.create(parentPayload);
      newUser.registrationStatus = 'approved';
      newUser.isActive = true;
      await newUser.save();
    }

    if (role === 'teacher') {
      const finalTeacherId = teacherId || await generateUniqueId('TCH', Teacher, 'teacherId');
      
      await Teacher.create({
        user: newUser._id,
        teacherId: finalTeacherId,
        school: school ? school._id : undefined,
        registrationStatus: school ? 'approved' : 'pending'
      });

      if (school) {
        newUser.registrationStatus = 'approved';
        newUser.isActive = true;
      } else {
        newUser.registrationStatus = 'pending';
        newUser.isActive = false;
      }
      await newUser.save();
    }

    if (role === 'student') {
      const finalStudentId = studentId || await generateUniqueId('STU', StudentRegistration, 'studentId');
      
      await StudentRegistration.create({
        user: newUser._id,
        studentId: finalStudentId,
        school: school ? school._id : undefined,
        registrationData: { firstName, lastName },
        registrationStatus: school ? 'approved' : 'pending'
      });

      if (school) {
        newUser.registrationStatus = 'approved';
        newUser.isActive = true;
      } else {
        newUser.registrationStatus = 'pending';
        newUser.isActive = false;
      }
      await newUser.save();
    }

    if (newUser.registrationStatus === 'approved') {
      createSendToken(newUser, 201, res);
    } else {
      res.status(201).json({
        status: 'success',
        message: 'Inscription réussie! Votre compte est en attente d\'approbation par un administrateur.',
        data: {
          user: {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            registrationStatus: newUser.registrationStatus
          },
          requiresApproval: true
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' 
        ? 'Cette adresse email est déjà utilisée'
        : field === 'teacherId' 
        ? 'Cet ID enseignant existe déjà'
        : field === 'studentId' 
        ? 'Cet ID étudiant existe déjà'
        : 'Cette valeur existe déjà';
      return res.status(400).json({ status: 'error', message });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }

    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de l\'inscription: ' + error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    const user = await User.findOne({ email }).select('+password').populate('school');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (user.registrationStatus !== 'approved') {
      return res.status(401).json({
        status: 'error',
        message: 'Votre compte est en attente d\'approbation. Veuillez contacter l\'administrateur.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Votre compte est désactivé. Veuillez contacter l\'administrateur.'
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la connexion: ' + error.message
    });
  }
};

// ✅ IMPROVED: Better error handling and logging
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Extract token from Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // ✅ ADDED: Better logging for debugging
    if (!token) {
      console.log('🔒 No token provided');
      return res.status(401).json({
        status: 'error',
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
      });
    }

    // ✅ ADDED: Log token format for debugging (first/last 10 chars only)
    if (process.env.NODE_ENV === 'test') {
      console.log('🔑 Token received:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || jwtConfig.secret;
    const decoded = await promisify(jwt.verify)(token, jwtSecret);

    // ✅ ADDED: Log decoded payload for debugging
    if (process.env.NODE_ENV === 'test') {
      console.log('✅ Token decoded successfully, user ID:', decoded.id);
    }

    const currentUser = await User.findById(decoded.id).populate('school');

    if (!currentUser) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur associé à ce token n\'existe plus.'
      });
    }

    if (currentUser.registrationStatus !== 'approved') {
      return res.status(401).json({
        status: 'error',
        message: 'Votre compte est en attente d\'approbation'
      });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Votre compte est désactivé'
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    // ✅ IMPROVED: Better error logging
    console.error('Protect middleware error:', error);
    
    // More specific error messages
    if (error.name === 'JsonWebTokenError') {
      // ✅ ADDED: Log the specific JWT error
      console.log('JWT Error details:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Token JWT invalide'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    }
    res.status(401).json({
      status: 'error',
      message: 'Erreur d\'authentification: ' + error.message
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas la permission d\'effectuer cette action'
      });
    }
    next();
  };
};

exports.getPendingRegistrations = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      registrationStatus: 'pending',
      role: { $in: ['teacher', 'student'] }
    })
      .populate('school')
      .select('-password')
      .sort({ createdAt: -1 });

    const pendingRegistrations = [];

    for (const user of pendingUsers) {
      let registrationData = { user };

      if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        registrationData.teacher = teacher;
      } else if (user.role === 'student') {
        const studentReg = await StudentRegistration.findOne({ user: user._id });
        registrationData.studentRegistration = studentReg;
      }

      pendingRegistrations.push(registrationData);
    }

    res.status(200).json({
      status: 'success',
      results: pendingRegistrations.length,
      data: { registrations: pendingRegistrations }
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la récupération des inscriptions en attente: ' + error.message
    });
  }
};

exports.approveRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { schoolId, classId, additionalData } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        status: 'error',
        message: 'L\'ID de l\'école est obligatoire'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'École non trouvée'
      });
    }

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId });
      if (teacher) {
        teacher.school = schoolId;
        teacher.registrationStatus = 'approved';
        teacher.isActive = true;
        await teacher.save();
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'Enregistrement enseignant non trouvé'
        });
      }
    } else if (user.role === 'student') {
      const studentReg = await StudentRegistration.findOne({ user: userId });
      if (studentReg) {
        await Student.create({
          studentId: studentReg.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: additionalData?.dateOfBirth || new Date('2000-01-01'),
          gender: additionalData?.gender || 'male',
          school: schoolId,
          class: classId || null,
          level: additionalData?.level || 'college',
          series: additionalData?.series || null,
          enrollmentDate: new Date(),
          isActive: true
        });

        await StudentRegistration.deleteOne({ user: userId });
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'Enregistrement d\'inscription étudiant non trouvé'
        });
      }
    }

    user.registrationStatus = 'approved';
    user.isActive = true;
    user.school = schoolId;
    await user.save();
    await user.populate('school');

    res.status(200).json({
      status: 'success',
      message: `${user.role === 'teacher' ? 'Enseignant' : 'Élève'} approuvé avec succès et assigné à l'école`,
      data: { user }
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Erreur de duplication: Cet ID existe déjà'
      });
    }
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de l\'approbation: ' + error.message
    });
  }
};

exports.rejectRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    user.registrationStatus = 'rejected';
    await user.save();

    if (user.role === 'teacher') {
      await Teacher.findOneAndUpdate(
        { user: userId },
        { registrationStatus: 'rejected' }
      );
    } else if (user.role === 'student') {
      await StudentRegistration.findOneAndUpdate(
        { user: userId },
        { registrationStatus: 'rejected' }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Inscription rejetée avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors du rejet: ' + error.message
    });
  }
};

exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Déconnexion réussie'
  });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez fournir le mot de passe actuel et le nouveau mot de passe'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Mot de passe actuel incorrect'
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors du changement de mot de passe: ' + error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Utilisez la route /change-password pour modifier votre mot de passe'
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('school');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du profil: ' + error.message
    });
  }
};