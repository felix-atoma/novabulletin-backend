const express = require('express');
const parentController = require('../controllers/parentController');
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
router.use(authController.restrictTo('parent', 'admin', 'director'));

/**
 * Parent routes
 */
router.get('/me',
  ensure(parentController.getParentInfo, "getParentInfo")
);

router.get('/children',
  ensure(parentController.getChildren, "getChildren")
);

router.get('/children/:studentId/bulletins',
  ensure(parentController.getChildBulletins, "getChildBulletins")
);

router.get('/children/:studentId/grades/:trimester',
  ensure(parentController.getChildGrades, "getChildGrades")
);

/**
 * Admin / Director routes
 */
router.get('/',
  authController.restrictTo('admin', 'director'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { parents: [] }
    });
  }
);

router.patch('/:id/payment-status',
  authController.restrictTo('admin', 'director'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Statut de paiement mis à jour'
    });
  }
);

module.exports = router;
