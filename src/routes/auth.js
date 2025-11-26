// routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validation.validateRegister, authController.register);
router.post('/login', authController.login);

// Routes protégées
router.use(authController.protect);

// User management
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

// Registration management (admin/director only)
router.get('/pending-registrations', 
  authController.restrictTo('admin', 'director'), 
  authController.getPendingRegistrations
);

// Changed from PATCH to POST to match frontend
router.post('/approve-registration/:userId', 
  authController.restrictTo('admin', 'director'), 
  authController.approveRegistration
);

router.post('/reject-registration/:userId', 
  authController.restrictTo('admin', 'director'), 
  authController.rejectRegistration
);

// Password management
router.post('/forgot-password', async (req, res) => {
  // TODO: Implement password reset functionality
  res.status(200).json({
    status: 'success',
    message: 'Email de réinitialisation envoyé'
  });
});

router.post('/reset-password/:token', async (req, res) => {
  // TODO: Implement password reset functionality
  res.status(200).json({
    status: 'success',
    message: 'Mot de passe réinitialisé avec succès'
  });
});

// Password and profile management
router.put('/change-password', authController.changePassword);
router.put('/profile', authController.updateProfile);

module.exports = router;