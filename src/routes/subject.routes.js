const express = require('express');
const subjectController = require('../controllers/subjectController');
const authController = require('../controllers/authController');
const roleCheck = require('../middleware/roleCheck');

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
 * SUBJECT CRUD
 */
router.route('/')
  .get(ensure(subjectController.getAllSubjects, "getAllSubjects"))
  .post(
    roleCheck.requireRole('admin', 'director'),
    ensure(subjectController.createSubject, "createSubject")
  );

router.route('/:id')
  .get(ensure(subjectController.getSubject, "getSubject"))
  .patch(
    roleCheck.requireRole('admin', 'director'),
    ensure(subjectController.updateSubject, "updateSubject")
  )
  .delete(
    roleCheck.requireRole('admin', 'director'),
    ensure(subjectController.deleteSubject, "deleteSubject")
  );

/**
 * BY LEVEL / SERIES
 */
router.get('/level/:level',
  ensure(subjectController.getSubjectsByLevel, "getSubjectsByLevel")
);

router.get('/series/:series',
  ensure(subjectController.getSubjectsBySeries, "getSubjectsBySeries")
);

/**
 * ASSIGN SUBJECTS TO TEACHERS
 */
router.patch('/:id/teachers',
  roleCheck.requireRole('admin', 'director'),
  ensure(subjectController.assignTeachers, "assignTeachers")
);

module.exports = router;
