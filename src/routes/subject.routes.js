// routes/subjectRoutes.js
const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users can view subjects)
router.get('/', subjectController.getAllSubjects);
router.get('/coefficients', subjectController.getCoefficientReference);
router.get('/class/:classId', subjectController.getSubjectsByClass);
router.get('/:id', subjectController.getSubject);

// Protected routes (admin, director, teacher only)
router.post(
  '/',
  restrictTo('admin', 'director', 'teacher'),
  subjectController.createSubject
);

router.post(
  '/bulk',
  restrictTo('admin', 'director'),
  subjectController.bulkCreateSubjects
);

router.put(
  '/:id',
  restrictTo('admin', 'director', 'teacher'),
  subjectController.updateSubject
);

router.delete(
  '/:id',
  restrictTo('admin', 'director'),
  subjectController.deleteSubject
);

module.exports = router;