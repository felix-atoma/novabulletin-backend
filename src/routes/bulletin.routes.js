const express = require('express');
const bulletinController = require('../controllers/bulletinController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Generate single bulletin
router.post('/generate', bulletinController.generateBulletin);

// Generate bulk bulletins
router.post('/generate/bulk', bulletinController.generateBulkBulletins);

// Get all bulletins
router.get('/', bulletinController.getAllBulletins);

// Get student bulletins
router.get('/student/:studentId', bulletinController.getStudentBulletins);

// Get class bulletins (with or without trimester)
router.get('/class/:classId', bulletinController.getClassBulletins);
router.get('/class/:classId/trimester/:trimester', bulletinController.getClassBulletins);

// Get specific bulletin
router.get('/:id', bulletinController.getBulletin);

// Update bulletin
router.patch('/:id', bulletinController.updateBulletin);

// Delete bulletin
router.delete('/:id', bulletinController.deleteBulletin);

// Approve bulletin
router.patch('/:id/approve', bulletinController.publishBulletin);

// Publish bulletin
router.patch('/:id/publish', bulletinController.publishBulletin);

// Unpublish bulletin
router.patch('/:id/unpublish', bulletinController.unpublishBulletin);

// Download bulletin PDF
router.post('/:id/download', bulletinController.downloadBulletinPDF);

module.exports = router;