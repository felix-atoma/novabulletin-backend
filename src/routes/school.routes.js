const express = require('express');
const schoolController = require('../controllers/schoolController');
const authController = require('../controllers/authController');
const { requireRole, requireSchoolAccess } = require('../middleware/validation');

const router = express.Router();

console.log('🏫 School routes loading...');

// Protect all routes
router.use(authController.protect);

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes (/:id)
// Otherwise Express will match "me" and "stats" as IDs

// Get current user's school - MOVE BEFORE /:id
router.get(
  '/me',
  requireSchoolAccess,
  schoolController.getSchool
);

// School statistics - MOVE BEFORE /:id
router.get(
  '/stats',
  requireSchoolAccess,
  schoolController.getSchoolStats
);

// Get all schools (admin only)
router.get(
  '/',
  authController.restrictTo('admin'),
  schoolController.getAllSchools
);

// Create school (admin only)
router.post(
  '/',
  authController.restrictTo('admin'),
  schoolController.createSchool
);

// Get specific school by ID - MUST BE AFTER /me and /stats
router.get(
  '/:id',
  schoolController.getSchoolById
);

// Update school
router.patch(
  '/:id',
  authController.restrictTo('admin', 'director'),
  schoolController.updateSchool
);

// Delete school (admin only)
router.delete(
  '/:id',
  authController.restrictTo('admin'),
  schoolController.deleteSchool
);

console.log('✅ School routes registered:', router.stack.map(layer => {
  if (layer.route) {
    return `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`;
  }
  return null;
}).filter(Boolean));

module.exports = router;