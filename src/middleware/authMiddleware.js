const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur associé à ce token n\'existe plus.'
      });
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          status: 'error',
          message: 'L\'utilisateur a récemment changé son mot de passe. Veuillez vous reconnecter.'
        });
      }
    }

    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token invalide'
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

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.passwordChangedAt) {
        const changedTimestamp = parseInt(
          currentUser.passwordChangedAt.getTime() / 1000,
          10
        );
        if (decoded.iat < changedTimestamp) {
          return next();
        }
      }

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};