// routes/parentRoutes.js
const express = require('express');
const parentController = require('../controllers/parentController');
const authController = require('../controllers/authController');

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

// Protect all routes - must be authenticated
router.use(authController.protect);

// Restrict to parents (and admins/directors for oversight)
router.use(authController.restrictTo('parent', 'admin', 'director'));

/**
 * Parent-specific routes
 */

// Get parent profile information
router.get('/me',
  ensure(parentController.getParentInfo, "getParentInfo")
);

// Get all children associated with parent
router.get('/children',
  ensure(parentController.getChildren, "getChildren")
);

// Get bulletins for a specific child
router.get('/children/:studentId/bulletins',
  ensure(parentController.getChildBulletins, "getChildBulletins")
);

// Get grades for a specific child and trimester
router.get('/children/:studentId/grades/:trimester',
  ensure(parentController.getChildGrades, "getChildGrades")
);

// Download bulletin PDF
router.get('/bulletins/:bulletinId/download',
  ensure(parentController.downloadBulletin, "downloadBulletin")
);

// Get payment status for a student
router.get('/payment-status/:studentId',
  ensure(parentController.getPaymentStatus, "getPaymentStatus")
);

/**
 * Admin / Director routes
 */

// List all parents (admin/director only)
router.get('/',
  authController.restrictTo('admin', 'director'),
  async (req, res) => {
    try {
      const Parent = require('../models/Parent');
      const parents = await Parent.find({ school: req.user.school })
        .populate('user', 'firstName lastName email')
        .populate('children.student', 'firstName lastName studentId class');
      
      res.status(200).json({
        status: 'success',
        results: parents.length,
        data: { parents }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }
);

// Update parent payment status (admin/director only)
router.patch('/:id/payment-status',
  authController.restrictTo('admin', 'director'),
  async (req, res) => {
    try {
      const Parent = require('../models/Parent');
      const { paymentStatus, totalAmountDue, amountPaid, nextPaymentDue } = req.body;
      
      const parent = await Parent.findByIdAndUpdate(
        req.params.id,
        {
          paymentStatus,
          totalAmountDue,
          amountPaid,
          nextPaymentDue,
          lastPaymentDate: paymentStatus === 'paid' ? new Date() : undefined
        },
        { new: true, runValidators: true }
      );

      if (!parent) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent non trouvé'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { parent }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }
);

module.exports = router;