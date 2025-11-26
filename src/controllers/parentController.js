// controllers/parentController.js
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Bulletin = require('../models/Bulletin');
const Payment = require('../models/Payment');

/**
 * Get parent information
 * GET /parents/me
 */
exports.getParentInfo = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id })
      .populate({
        path: 'children.student',
        populate: [
          { path: 'class', select: 'name grade teacher' },
          { path: 'school', select: 'name email phone' }
        ]
      })
      .populate('school', 'name email phone');

    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        parent
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get parent's children with full details
 * GET /parents/children
 */
exports.getChildren = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id })
      .populate({
        path: 'children.student',
        populate: [
          { path: 'class', select: 'name grade teacher' },
          { path: 'school', select: 'name email phone' }
        ]
      });

    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    const children = parent.children.map(child => ({
      student: child.student,
      relationship: child.relationship
    }));

    res.status(200).json({
      status: 'success',
      data: {
        children
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get bulletins for a specific child
 * GET /parents/children/:studentId/bulletins
 */
exports.getChildBulletins = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Verify parent has access to this student
    const parent = await Parent.findOne({ user: req.user._id });
    
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    const hasAccess = parent.children.some(child => 
      child.student.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé aux bulletins de cet élève'
      });
    }

    // Check payment status (paid or exempted allows access)
    const canAccessBulletins = ['paid', 'exempted'].includes(parent.paymentStatus);

    if (!canAccessBulletins) {
      return res.status(403).json({
        status: 'error',
        message: 'Paiement requis pour accéder aux bulletins',
        paymentRequired: true,
        paymentStatus: parent.paymentStatus
      });
    }

    // Fetch bulletins for the student
    const bulletins = await Bulletin.find({ 
      student: studentId,
      isPublished: true // Only show published bulletins to parents
    })
      .populate('class', 'name grade')
      .sort({ academicYear: -1, trimester: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        bulletins
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get grades for a specific child and trimester
 * GET /parents/children/:studentId/grades/:trimester
 */
exports.getChildGrades = async (req, res) => {
  try {
    const { studentId, trimester } = req.params;
    
    // Verify parent has access to this student
    const parent = await Parent.findOne({ user: req.user._id });
    
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    const hasAccess = parent.children.some(child => 
      child.student.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé aux notes de cet élève'
      });
    }

    // Fetch grades
    const Grade = require('../models/Grade');
    const grades = await Grade.find({ 
      student: studentId,
      trimester: trimester
    })
      .populate('subject', 'name coefficient')
      .populate('teacher', 'firstName lastName')
      .sort({ 'subject.name': 1 });

    res.status(200).json({
      status: 'success',
      data: {
        grades
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Download bulletin PDF
 * GET /parents/bulletins/:bulletinId/download
 */
exports.downloadBulletin = async (req, res) => {
  try {
    const { bulletinId } = req.params;
    
    // Find bulletin
    const bulletin = await Bulletin.findById(bulletinId)
      .populate('student', 'firstName lastName studentId');
    
    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    // Verify parent has access
    const parent = await Parent.findOne({ user: req.user._id });
    const hasAccess = parent.children.some(child => 
      child.student.toString() === bulletin.student._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé à ce bulletin'
      });
    }

    // Check payment status
    const canAccessBulletins = ['paid', 'exempted'].includes(parent.paymentStatus);
    if (!canAccessBulletins) {
      return res.status(403).json({
        status: 'error',
        message: 'Paiement requis pour télécharger les bulletins'
      });
    }

    // Generate or retrieve PDF
    const pdfService = require('../services/pdfService');
    const pdfBuffer = await pdfService.generateBulletinPDF(bulletinId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin-${bulletin.student.studentId}-${bulletin.trimester}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get payment status for a student
 * GET /parents/payment-status/:studentId
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const parent = await Parent.findOne({ user: req.user._id });
    
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    // Verify access
    const hasAccess = parent.children.some(child => 
      child.student.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé'
      });
    }

    // Get payment information
    const payments = await Payment.find({ 
      student: studentId,
      parent: parent._id 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        parentStatus: parent.paymentStatus,
        totalAmountDue: parent.totalAmountDue,
        amountPaid: parent.amountPaid,
        lastPaymentDate: parent.lastPaymentDate,
        nextPaymentDue: parent.nextPaymentDue,
        payments: payments
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};