const express = require('express');
const pdfController = require('../controllers/pdfController');
const authController = require('../controllers/authController');
const roleCheck = require('../middleware/roleCheck');
const paymentCheck = require('../middleware/paymentCheck');

const router = express.Router();

router.use(authController.protect);

// Téléchargement des bulletins
router.get('/bulletin/:bulletinId',
  paymentCheck.requirePayment,
  pdfController.downloadBulletin
);

// Prévisualisation des bulletins
router.post('/bulletin/preview',
  roleCheck.canManageGrades,
  pdfController.previewBulletin
);

// Génération de rapports
router.get('/report/class/:classId/trimester/:trimester',
  roleCheck.canManageGrades,
  pdfController.generateClassReport
);

router.get('/report/school/trimester/:trimester',
  roleCheck.requireRole('admin', 'director'),
  pdfController.generateSchoolReport
);

// Reçus de paiement
router.get('/receipt/payment/:paymentId',
  pdfController.generatePaymentReceipt
);

// Certificats
router.get('/certificate/student/:studentId',
  roleCheck.requireRole('admin', 'director'),
  pdfController.generateStudentCertificate
);

// Export des données
router.get('/export/students',
  roleCheck.requireRole('admin', 'director'),
  pdfController.exportStudents
);

router.get('/export/grades/:classId/:trimester',
  roleCheck.canManageGrades,
  pdfController.exportGrades
);

module.exports = router;