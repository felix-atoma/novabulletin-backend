// routes/bulletinRoutes.js
const express = require('express');
const router = express.Router();
const bulletinController = require('../controllers/bulletinController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(protect);

// Get all bulletins (admin, director, teacher)
router.get(
  '/',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.getAllBulletins
);

// Get bulletins for a specific class
router.get(
  '/class/:classId/:trimester?',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.getClassBulletins
);

// Get bulletins for a specific student
router.get(
  '/student/:studentId',
  bulletinController.getStudentBulletins
);

// Get single bulletin
router.get('/:id', bulletinController.getBulletin);

// Download bulletin as PDF
router.get('/:id/download', bulletinController.downloadBulletinPDF);

// Generate a single bulletin
router.post(
  '/generate',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.generateBulletin
);

// Generate bulletins for entire class
router.post(
  '/generate/bulk',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.generateBulkBulletins
);

// Update bulletin (appreciation)
router.put(
  '/:id',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.updateBulletin
);

// Publish bulletin
router.patch(
  '/:id/publish',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.publishBulletin
);

// Unpublish bulletin
router.patch(
  '/:id/unpublish',
  restrictTo('admin', 'director', 'teacher'),
  bulletinController.unpublishBulletin
);

// Delete bulletin
router.delete(
  '/:id',
  restrictTo('admin', 'director'),
  bulletinController.deleteBulletin
);

module.exports = router;