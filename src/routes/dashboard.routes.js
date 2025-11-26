// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../controllers/authController');

console.log('📊 Dashboard routes loading...');

// All dashboard routes require authentication
router.use(protect);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get recent activity
router.get('/activity', dashboardController.getRecentActivity);

// Get upcoming events
router.get('/events', dashboardController.getUpcomingEvents);

// Get quick actions based on role
router.get('/quick-actions', dashboardController.getQuickActions);

// Get user-specific dashboard data
router.get('/me', dashboardController.getUserDashboard);

console.log('✅ Dashboard routes registered:', router.stack.map(layer => {
  if (layer.route) {
    return `${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`;
  }
}).filter(Boolean));

module.exports = router;