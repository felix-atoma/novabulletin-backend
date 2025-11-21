const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Payment = require('../models/Payment');

exports.getParentInfo = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id })
      .populate({
        path: 'children.student',
        populate: [
          { path: 'class', select: 'name grade teacher' },
          { path: 'school', select: 'name' }
        ]
      });

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

exports.getChildren = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id })
      .populate({
        path: 'children.student',
        populate: [
          { path: 'class', select: 'name grade teacher' },
          { path: 'school', select: 'name' }
        ]
      });

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

exports.getChildBulletins = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const parent = await Parent.findOne({ user: req.user._id });
    const hasAccess = parent.children.some(child => 
      child.student.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé aux bulletins de cet élève'
      });
    }

    // Vérifier le statut de paiement
    if (parent.paymentStatus !== 'paid') {
      return res.status(403).json({
        status: 'error',
        message: 'Paiement requis pour accéder aux bulletins'
      });
    }

    const bulletins = await Bulletin.find({ student: studentId })
      .populate('class', 'name')
      .sort({ trimester: 1 });

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