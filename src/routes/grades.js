// src/routes/grade.routes.js
const express = require('express');
const gradeController = require('../controllers/gradeController');
const { validateGrade, canManageGrades } = require('../middleware/validation');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

console.log('=== GRADE CONTROLLER DEBUG ===');
console.log('gradeController type:', typeof gradeController);
console.log('gradeController keys:', Object.keys(gradeController));
console.log('updateGrade exists?', typeof gradeController.updateGrade);
console.log('updateGrade value:', gradeController.updateGrade);
console.log('---');
console.log('validation type:', typeof validateGrade);
console.log('validation keys:', Object.keys(validateGrade));
console.log('validateGrade exists?', typeof validateGrade);
console.log('validateGrade value:', validateGrade);
console.log('==============================');

/* ===========================
   GRADE MANAGEMENT ROUTES
=========================== */

// Create a single grade
router.post(
  '/',
  canManageGrades,
  validateGrade,
  gradeController.enterGrade
);

// Bulk grade entry
router.post(
  '/bulk',
  canManageGrades,
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
  canManageGrades,
  gradeController.getClassGrades
);

// Get all grades (with filters)
router.get(
  '/',
  canManageGrades,
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
  canManageGrades,
  validateGrade,
  gradeController.updateGrade
);

// Delete grade
router.delete(
  '/:id',
  canManageGrades,
  gradeController.deleteGrade
);

// Publish grade
router.patch(
  '/:id/publish',
  canManageGrades,
  gradeController.publishGrade
);

// Import grades
router.post(
  '/import/:classId/:subjectId/:trimester',
  canManageGrades,
  gradeController.importGrades
);

// Export grades
router.get(
  '/export/:classId/:subjectId/:trimester',
  canManageGrades,
  gradeController.exportGrades
);

module.exports = router;