// src/routes/class.routes.js
const express = require('express');
const classController = require('../controllers/classController');
const authController = require('../controllers/authController');
const { requireRole, canManageGrades } = require('../middleware/validation');

const router = express.Router();

/**
 * Helper to ensure controller functions exist
 */
function ensure(fn, name) {
  if (!fn || typeof fn !== "function") {
    return (req, res) => {
      res.status(500).json({
        status: "error",
        message: `Controller function "${name}" is missing or undefined`
      });
    };
  }
  return fn;
}

router.use(authController.protect);

/**
 * CLASS CRUD routes
 */
router.route('/')
  .get(ensure(classController.getAllClasses, "getAllClasses"))
  .post(
    requireRole('admin'),
    ensure(classController.createClass, "createClass")
  );

router.route('/:id')
  .get(ensure(classController.getClass, "getClass"))
  .patch(
    requireRole('admin'),
    ensure(classController.updateClass, "updateClass")
  )
  .delete(
    requireRole('admin'),
    ensure(classController.deleteClass, "deleteClass")
  );

/**
 * CLASS RELATION ROUTES
 */
router.get('/:id/students',
  ensure(classController.getClassStudents, "getClassStudents")
);

router.get('/:id/subjects',
  ensure(classController.getClassSubjects, "getClassSubjects")
);

/**
 * CLASS STATISTICS
 */
router.get('/:id/stats/:trimester',
  canManageGrades,
  ensure(classController.getClassStatistics, "getClassStatistics")
);

module.exports = router;