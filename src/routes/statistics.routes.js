const express = require('express');
const statisticsController = require('../controllers/statisticsController');
const authController = require('../controllers/authController');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(authController.protect);

// Statistiques élève
router.get('/student/:studentId/trimester/:trimester',
  statisticsController.getStudentStatistics
);

// Statistiques classe
router.get('/class/:classId/trimester/:trimester',
  roleCheck.canManageGrades,
  statisticsController.getClassStatistics
);

// Statistiques matière
router.get('/subject/:subjectId/class/:classId/trimester/:trimester',
  roleCheck.canManageGrades,
  statisticsController.getSubjectStatistics
);

// Classements
router.get('/ranking/class/:classId/trimester/:trimester',
  statisticsController.getRanking
);

router.get('/ranking/school/:level/trimester/:trimester',
  roleCheck.requireRole('admin', 'director'),
  statisticsController.getSchoolRanking
);

// Tableau de bord
router.get('/dashboard',
  statisticsController.getDashboardStats
);

// Statistiques avancées
router.get('/advanced/school',
  roleCheck.requireRole('admin', 'director'),
  statisticsController.getAdvancedSchoolStats
);

router.get('/advanced/teacher/:teacherId',
  roleCheck.requireRole('admin', 'director'),
  statisticsController.getTeacherStats
);

// Export des statistiques
router.get('/export/class/:classId/trimester/:trimester',
  roleCheck.canManageGrades,
  statisticsController.exportClassStatistics
);

module.exports = router;