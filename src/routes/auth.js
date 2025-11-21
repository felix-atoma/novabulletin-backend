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

router.patch('/approve-registration/:userId', 
  authController.restrictTo('admin', 'director'), 
  authController.approveRegistration
);

router.patch('/reject-registration/:userId', 
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

router.patch('/reset-password/:token', async (req, res) => {
  // TODO: Implement password reset functionality
  res.status(200).json({
    status: 'success',
    message: 'Mot de passe réinitialisé avec succès'
  });
});

module.exports = router;