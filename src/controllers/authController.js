// controllers/authController.js
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

// ==================== SUPER ADMIN FUNCTIONS ====================

// Create first admin user (one-time setup)
exports.createFirstAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'Un administrateur existe déjà dans le système'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    const adminUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || '',
      role: 'admin'
    });

    res.status(201).json({
      status: 'success',
      message: 'Administrateur principal créé avec succès',
      data: { user: adminUser }
    });
  } catch (error) {
    console.error('Create first admin error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'administrateur: ' + error.message
    });
  }
};

// Admin creates user (admin can create any type of user)
exports.adminCreateUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      schoolId,
      teacherId,
      studentId,
      additionalData
    } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    let school;
    if (schoolId) {
      school = await School.findById(schoolId);
      if (!school) {
        return res.status(400).json({
          status: 'error',
          message: 'École introuvable'
        });
      }
    }

    // Create user with admin as creator
    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone: phone || '',
      school: schoolId || null,
      createdBy: req.user._id
    });

    // Handle role-specific creation
    if (role === 'director' && schoolId) {
      await School.findByIdAndUpdate(schoolId, { director: newUser._id });
    } else if (role === 'teacher') {
      const finalTeacherId = teacherId || await generateUniqueId('TCH', Teacher, 'teacherId');
      await Teacher.create({
        user: newUser._id,
        teacherId: finalTeacherId,
        school: schoolId || null,
        registrationStatus: 'approved',
        isActive: true
      });
    } else if (role === 'student') {
      const finalStudentId = studentId || await generateUniqueId('STU', Student, 'studentId');
      await Student.create({
        user: newUser._id,
        studentId: finalStudentId,
        school: schoolId || null,
        dateOfBirth: additionalData?.dateOfBirth || new Date('2000-01-01'),
        gender: additionalData?.gender || 'male',
        class: additionalData?.classId || null,
        level: additionalData?.level || 'college',
        series: additionalData?.series || null,
        enrollmentDate: new Date(),
        isActive: true
      });
    } else if (role === 'parent') {
      await Parent.create({
        user: newUser._id,
        phone: phone || '',
        address: additionalData?.address || 'Non spécifié',
        school: schoolId || null
      });
    }

    await newUser.populate('school');

    res.status(201).json({
      status: 'success',
      message: 'Utilisateur créé avec succès',
      data: { user: newUser }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' 
        ? 'Cette adresse email est déjà utilisée'
        : 'Cette valeur existe déjà';
      return res.status(400).json({ status: 'error', message });
    }

    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'utilisateur: ' + error.message
    });
  }
};

// Get all schools with filtering and pagination
exports.getAllSchools = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    const [schools, total] = await Promise.all([
      School.find(filter)
        .populate('director', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      School.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: schools.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { schools }
    });
  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la récupération des écoles: ' + error.message
    });
  }
};

// Get all users with filtering and pagination
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, registrationStatus, schoolId, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (registrationStatus) filter.registrationStatus = registrationStatus;
    if (schoolId) filter.school = schoolId;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('school', 'name city')
        .populate('createdBy', 'firstName lastName')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la récupération des utilisateurs: ' + error.message
    });
  }
};

// Manage user status (activate/deactivate, approve/reject)
exports.manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, registrationStatus } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    // Prevent modifying other admins (only super admin can modify themselves)
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Non autorisé à modifier un administrateur'
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (registrationStatus) updateData.registrationStatus = registrationStatus;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('school');

    // Update role-specific records if approved
    if (registrationStatus === 'approved' && user.role === 'teacher') {
      await Teacher.findOneAndUpdate(
        { user: userId },
        { registrationStatus: 'approved', isActive: true }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Manage user error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la gestion de l\'utilisateur: ' + error.message
    });
  }
};

// Platform statistics
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalSchools,
      totalUsers,
      pendingRegistrations,
      totalTeachers,
      totalStudents,
      totalParents,
      totalDirectors,
      activeUsers
    ] = await Promise.all([
      School.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ registrationStatus: 'pending' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'parent' }),
      User.countDocuments({ role: 'director' }),
      User.countDocuments({ isActive: true, registrationStatus: 'approved' })
    ]);

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalSchools,
          totalUsers,
          pendingRegistrations,
          totalTeachers,
          totalStudents,
          totalParents,
          totalDirectors,
          activeUsers,
          recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques: ' + error.message
    });
  }
};

// Create school (admin can create schools directly)
exports.createSchool = async (req, res) => {
  try {
    const { name, address, city, phone, email, country, directorId } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nom, l\'adresse et la ville sont obligatoires'
      });
    }

    const existingSchool = await School.findOne({ name });
    if (existingSchool) {
      return res.status(400).json({
        status: 'error',
        message: 'Une école avec ce nom existe déjà'
      });
    }

    let director;
    if (directorId) {
      director = await User.findOne({ _id: directorId, role: 'director' });
      if (!director) {
        return res.status(400).json({
          status: 'error',
          message: 'Directeur non trouvé ou rôle incorrect'
        });
      }
    }

    const schoolData = {
      name,
      address,
      city,
      phone: phone || '',
      email: email || '',
      country: country || 'Togo',
      createdBy: req.user._id
    };

    if (director) {
      schoolData.director = director._id;
      // Update director's school
      await User.findByIdAndUpdate(director._id, { school: schoolData._id });
    }

    const school = await School.create(schoolData);

    res.status(201).json({
      status: 'success',
      message: 'École créée avec succès',
      data: { school }
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'école: ' + error.message
    });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, address, city, phone, email, country, directorId } = req.body;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'École non trouvée'
      });
    }

    if (name && name !== school.name) {
      const existingSchool = await School.findOne({ name });
      if (existingSchool) {
        return res.status(400).json({
          status: 'error',
          message: 'Une école avec ce nom existe déjà'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (country) updateData.country = country;

    if (directorId) {
      const director = await User.findOne({ _id: directorId, role: 'director' });
      if (!director) {
        return res.status(400).json({
          status: 'error',
          message: 'Directeur non trouvé ou rôle incorrect'
        });
      }
      updateData.director = directorId;
      
      // Update director's school assignment
      await User.findByIdAndUpdate(directorId, { school: schoolId });
    }

    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      updateData,
      { new: true, runValidators: true }
    ).populate('director', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      message: 'École mise à jour avec succès',
      data: { school: updatedSchool }
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour de l\'école: ' + error.message
    });
  }
};

// ==================== EXISTING AUTH FUNCTIONS ====================

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

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Prevent admin registration through normal registration
    if (role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Inscription en tant qu\'administrateur non autorisée'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    let school;

    // Directors create a new school during registration
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

    // Create user
    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone: phone || '',
      school: school ? school._id : undefined
    });

    // Handle director post-creation
    if (role === 'director' && school) {
      await School.findByIdAndUpdate(school._id, { director: newUser._id });
    }

    // Handle parent registration
    if (role === 'parent') {
      const parentPayload = {
        user: newUser._id,
        phone: phone || '',
        address: address || 'Non spécifié'
      };
      if (school) parentPayload.school = school._id;
      
      await Parent.create(parentPayload);
    }

    // Handle teacher registration
    if (role === 'teacher') {
      const finalTeacherId = teacherId || await generateUniqueId('TCH', Teacher, 'teacherId');
      
      await Teacher.create({
        user: newUser._id,
        teacherId: finalTeacherId,
        school: school ? school._id : undefined,
        registrationStatus: school ? 'approved' : 'pending'
      });

      if (!school) {
        newUser.registrationStatus = 'pending';
        newUser.isActive = false;
        await newUser.save();
      }
    }

    // Handle student registration
    if (role === 'student') {
      const finalStudentId = studentId || await generateUniqueId('STU', StudentRegistration, 'studentId');
      
      await StudentRegistration.create({
        user: newUser._id,
        studentId: finalStudentId,
        school: school ? school._id : undefined,
        registrationData: { firstName, lastName },
        registrationStatus: school ? 'approved' : 'pending'
      });

      if (!school) {
        newUser.registrationStatus = 'pending';
        newUser.isActive = false;
        await newUser.save();
      }
    }

    await newUser.populate('school');

    // Send response
    if (newUser.registrationStatus === 'approved') {
      createSendToken(newUser, 201, res);
    } else {
      res.status(201).json({
        status: 'success',
        message: 'Inscription réussie! Votre compte est en attente d\'approbation par un administrateur.',
        data: {
          user: newUser,
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

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || jwtConfig.secret;
    const decoded = await promisify(jwt.verify)(token, jwtSecret);

    const currentUser = await User.findById(decoded.id).populate('school');

    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur associé à ce token n\'existe plus.'
      });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur a récemment changé son mot de passe! Veuillez vous reconnecter.'
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token invalide'
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

// Admin-specific middleware
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

// School-level admin middleware (director or admin)
exports.isSchoolAdmin = (req, res, next) => {
  if (!['admin', 'director'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Accès réservé aux administrateurs d\'école'
    });
  }
  next();
};

// ==================== REGISTRATION MANAGEMENT ====================

exports.getPendingRegistrations = async (req, res) => {
  try {
    let filter = {
      registrationStatus: 'pending',
      role: { $in: ['teacher', 'student'] }
    };

    // If user is director, only show registrations for their school
    if (req.user.role === 'director' && req.user.school) {
      filter.school = req.user.school;
    }

    const pendingUsers = await User.find(filter)
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

    // For directors, they can only assign to their own school
    const finalSchoolId = req.user.role === 'director' ? req.user.school : schoolId;

    if (!finalSchoolId) {
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

    const school = await School.findById(finalSchoolId);
    if (!school) {
      return res.status(404).json({
        status: 'error',
        message: 'École non trouvée'
      });
    }

    // Check if director has permission for this school
    if (req.user.role === 'director' && !req.user.school.equals(finalSchoolId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas la permission d\'approuver pour cette école'
      });
    }

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId });
      if (teacher) {
        teacher.school = finalSchoolId;
        teacher.registrationStatus = 'approved';
        teacher.isActive = true;
        await teacher.save();
      }
    } else if (user.role === 'student') {
      const studentReg = await StudentRegistration.findOne({ user: userId });
      if (studentReg) {
        await Student.create({
          user: user._id,
          studentId: studentReg.studentId,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: additionalData?.dateOfBirth || new Date('2000-01-01'),
          gender: additionalData?.gender || 'male',
          school: finalSchoolId,
          class: classId || null,
          level: additionalData?.level || 'college',
          series: additionalData?.series || null,
          enrollmentDate: new Date(),
          isActive: true
        });

        await StudentRegistration.deleteOne({ user: userId });
      }
    }

    user.registrationStatus = 'approved';
    user.isActive = true;
    user.school = finalSchoolId;
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

    // Check if director has permission for this user's school
    if (req.user.role === 'director' && user.school && !req.user.school.equals(user.school)) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas la permission de rejeter cet utilisateur'
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

// ==================== USER PROFILE MANAGEMENT ====================

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

    // Don't allow password updates through this route
    if (req.body.password) {
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