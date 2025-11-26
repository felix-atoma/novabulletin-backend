// routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(protect);

// Get all grades (admin, director, teacher)
router.get(
  '/',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.getAllGrades
);

// Get grades for a specific student and trimester
router.get(
  '/student/:studentId/:trimester',
  gradeController.getStudentGrades
);

// Get grades for a class, subject, and trimester
router.get(
  '/class/:classId/subject/:subjectId/:trimester',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.getClassGrades
);

// Export grades for a class
router.get(
  '/export/:classId/:subjectId/:trimester',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.exportGrades
);

// Get single grade
router.get('/:id', gradeController.getGrade);

// Enter a single grade
router.post(
  '/',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.enterGrade
);

// Bulk enter grades for a class
router.post(
  '/bulk',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.bulkEnterGrades
);

// Import grades from CSV/Excel
router.post(
  '/import/:classId/:subjectId/:trimester',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.importGrades
);

// Update a grade
router.put(
  '/:id',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.updateGrade
);

// Publish a grade
router.patch(
  '/:id/publish',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.publishGrade
);

// Delete a grade
router.delete(
  '/:id',
  restrictTo('admin', 'director', 'teacher'),
  gradeController.deleteGrade
);

module.exports = router;