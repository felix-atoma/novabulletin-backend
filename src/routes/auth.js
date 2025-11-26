// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(authController.protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/update-password', authController.changePassword);
router.patch('/update-profile', authController.updateProfile);

module.exports = router;