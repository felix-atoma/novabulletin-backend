const Parent = require('../models/Parent');
const { checkPaymentStatus } = require('../services/paymentChecker');

exports.requirePayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return next();
    }

    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    // Vérifier le statut de paiement pour l'accès aux bulletins
    if (req.originalUrl.includes('/bulletins') || req.originalUrl.includes('/grades')) {
      const paymentStatus = await checkPaymentStatus(parent._id, req.params.studentId);
      
      if (!paymentStatus.hasPaid) {
        return res.status(403).json({
          status: 'error',
          message: 'Paiement requis pour accéder à cette ressource'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur de vérification du paiement'
    });
  }
};

exports.checkParentAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return next();
    }

    const parent = await Parent.findOne({ user: req.user._id });
    const hasAccess = parent.children.some(child => 
      child.student.toString() === req.params.studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé aux données de cet élève'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur de vérification des droits d\'accès'
    });
  }
};