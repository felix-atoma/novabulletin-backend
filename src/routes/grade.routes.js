const express = require('express');
const gradeController = require('../controllers/gradeController');
const authController = require('../controllers/authController');

const router = express.Router();

console.log('📊 Grade routes loading...');

// Protect all routes
router.use(authController.protect);

/* ===========================
   GRADE MANAGEMENT ROUTES
=========================== */

// Create a single grade - FIXED: Use correct method name
router.post(
  '/',
  gradeController.enterGrade
);

// Bulk grade entry - FIXED: Use correct method name
router.post(
  '/bulk',
  gradeController.bulkEnterGrades
);

// Get student grades for a trimester
router.get(
  '/student/:studentId/trimester/:trimester',
  gradeController.getStudentGrades
);

// Get class grades for a subject and trimester
router.get(
  '/class/:classId/subject/:subjectId/trimester/:trimester',
  gradeController.getClassGrades
);

// Get all grades (with filters)
router.get(
  '/',
  gradeController.getAllGrades
);

// Get specific grade
router.get(
  '/:id',
  gradeController.getGrade
);

// Update grade
router.patch(
  '/:id',
  gradeController.updateGrade
);

// Delete grade
router.delete(
  '/:id',
  gradeController.deleteGrade
);

// Publish grade
router.patch(
  '/:id/publish',
  gradeController.publishGrade
);

// Import grades
router.post(
  '/import/:classId/:subjectId/:trimester',
  gradeController.importGrades
);

// Export grades
router.get(
  '/export/:classId/:subjectId/:trimester',
  gradeController.exportGrades
);

console.log('✅ Grade routes registered:', router.stack.map(layer => {
  if (layer.route) {
    return `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`;
  }
  return null;
}).filter(Boolean));

module.exports = router;