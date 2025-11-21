const express = require('express');
const schoolController = require('../controllers/schoolController');
const authController = require('../controllers/authController');
const { requireRole, requireSchoolAccess } = require('../middleware/validation');

const router = express.Router();

console.log('🏫 School routes loading...');

// Protect all routes
router.use(authController.protect);

// Create school (admin only) - ADD THIS ROUTE
router.post(
  '/',
  authController.restrictTo('admin'),
  schoolController.createSchool
);

// Get all schools (admin only) - ADD THIS ROUTE
router.get(
  '/',
  authController.restrictTo('admin'),
  schoolController.getAllSchools
);

// Get specific school by ID - ADD THIS ROUTE
router.get(
  '/:id',
  schoolController.getSchoolById
);

// Update school - ADD THIS ROUTE
router.patch(
  '/:id',
  authController.restrictTo('admin', 'director'),
  schoolController.updateSchool
);

// Delete school (admin only) - ADD THIS ROUTE
router.delete(
  '/:id',
  authController.restrictTo('admin'),
  schoolController.deleteSchool
);

// School statistics - KEEP existing
router.get(
  '/stats',
  requireSchoolAccess,
  schoolController.getSchoolStats
);

// Get current user's school - KEEP existing but fix path
router.get(
  '/me',
  requireSchoolAccess,
  schoolController.getSchool
);

console.log('✅ School routes registered:', router.stack.map(layer => {
  if (layer.route) {
    return `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`;
  }
  return null;
}).filter(Boolean));

module.exports = router;