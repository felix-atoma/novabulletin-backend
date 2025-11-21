// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Protect all routes
router.use(authController.protect);
router.use(authController.restrictTo('admin', 'director'));

// Get pending registrations
router.get('/pending', authController.getPendingRegistrations);

// Approve registration
router.patch('/:userId/approve', authController.approveRegistration);

// Reject registration (optional - you can add this later)
router.patch('/:userId/reject', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    user.registrationStatus = 'rejected';
    await user.save();

    // Also update role-specific registration status
    if (user.role === 'teacher') {
      await Teacher.findOneAndUpdate(
        { user: userId },
        { registrationStatus: 'rejected' }
      );
    } else if (user.role === 'student') {
      await StudentRegistration.findOneAndUpdate(
        { user: userId },
        { registrationStatus: 'rejected' }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Inscription rejetée avec succès',
      data: {
        user
      }
    });

  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;