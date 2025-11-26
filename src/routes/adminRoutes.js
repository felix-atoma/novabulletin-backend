// routes/adminRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Super Admin setup (one-time use)
router.post('/setup/first-admin', authController.createFirstAdmin);

// User Management
router.get('/users', authController.protect, authController.isAdmin, authController.getAllUsers);
router.post('/users', authController.protect, authController.isAdmin, authController.adminCreateUser);
router.patch('/users/:userId/status', authController.protect, authController.isAdmin, authController.manageUser);

// School Management
router.get('/schools', authController.protect, authController.isAdmin, authController.getAllSchools);
router.post('/schools', authController.protect, authController.isAdmin, authController.createSchool);
router.patch('/schools/:schoolId', authController.protect, authController.isAdmin, authController.updateSchool);

// Platform Statistics
router.get('/stats', authController.protect, authController.isAdmin, authController.getPlatformStats);

// Registration Management (accessible to both admin and director)
router.get('/registrations/pending', authController.protect, authController.isSchoolAdmin, authController.getPendingRegistrations);
router.patch('/registrations/approve/:userId', authController.protect, authController.isSchoolAdmin, authController.approveRegistration);
router.patch('/registrations/reject/:userId', authController.protect, authController.isSchoolAdmin, authController.rejectRegistration);

module.exports = router;