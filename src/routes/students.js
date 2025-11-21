const express = require('express');
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const roleCheck = require('../middleware/roleCheck');
const paymentCheck = require('../middleware/paymentCheck');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .get(roleCheck.canManageStudents, studentController.getAllStudents)
  .post(roleCheck.canManageStudents, studentController.createStudent);

router.route('/:id')
  .get(paymentCheck.checkParentAccess, studentController.getStudent)
  .patch(roleCheck.canManageStudents, studentController.updateStudent)
  .delete(roleCheck.requireRole('admin', 'director'), studentController.deleteStudent);

// Routes spécifiques pour les parents
router.get('/:id/grades/:trimester', 
  paymentCheck.checkParentAccess,
  paymentCheck.requirePayment,
  studentController.getStudentGrades
);

router.get('/:id/bulletins',
  paymentCheck.checkParentAccess,
  paymentCheck.requirePayment,
  studentController.getStudentBulletins
);

// Routes pour les enseignants/directeurs
router.get('/class/:classId',
  roleCheck.canManageStudents,
  studentController.getClassStudents
);

router.patch('/:id/status',
  roleCheck.requireRole('admin', 'director'),
  studentController.updateStudentStatus
);

module.exports = router;