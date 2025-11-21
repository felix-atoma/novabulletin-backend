const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(authController.protect);

// Routes parents
router.post('/initiate',
  validation.validatePayment,
  paymentController.initiatePayment
);

router.get('/verify/:transactionId',
  paymentController.verifyPayment
);

router.get('/history',
  paymentController.getPaymentHistory
);

router.get('/status/:studentId',
  paymentController.getPaymentStatus
);

// Routes admin/directeur
router.get('/overdue',
  authController.restrictTo('admin', 'director'),
  paymentController.getOverduePayments
);

router.get('/school/stats',
  authController.restrictTo('admin', 'director'),
  paymentController.getPaymentStats
);

router.patch('/:id/status',
  authController.restrictTo('admin', 'director'),
  paymentController.updatePaymentStatus
);

// Webhooks pour les paiements mobiles
router.post('/webhook/mobile-money',
  paymentController.handleMobileMoneyWebhook
);

// Génération de reçus
router.get('/:id/receipt',
  paymentController.generateReceipt
);

module.exports = router;