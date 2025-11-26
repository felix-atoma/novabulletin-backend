const Payment = require('../models/Payment');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { initiateMobileMoneyPayment, verifyMobileMoneyPayment } = require('../services/mobileMoneyService');
const PDFDocument = require('pdfkit');

exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, studentId, schoolId } = req.query;

    const query = {};
    
    // Filter by school if user is director
    if (req.user.role === 'director' && req.user.school) {
      query.school = req.user.school;
    }
    
    // Additional filters
    if (status) query.status = status;
    if (studentId) query.student = studentId;
    if (schoolId && req.user.role === 'admin') query.school = schoolId;

    const payments = await Payment.find(query)
      .populate('parent', 'firstName lastName email phone')
      .populate('student', 'firstName lastName studentId')
      .populate('school', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la récupération des paiements: ' + error.message
    });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const { studentId, amount, paymentMethod, phoneNumber, mobileMoneyProvider, trimester } = req.body;

    const student = await Student.findById(studentId).populate('school', 'name academicYear');
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Élève non trouvé'
      });
    }

    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    let payment;
    
    if (paymentMethod === 'mobile_money') {
      const paymentResult = await initiateMobileMoneyPayment({
        amount,
        phoneNumber,
        provider: mobileMoneyProvider,
        studentName: `${student.firstName} ${student.lastName}`,
        trimester
      });

      payment = await Payment.create({
        parent: parent._id,
        student: studentId,
        school: student.school._id,
        amount,
        amountPaid: 0,
        paymentMethod,
        mobileMoneyProvider,
        phoneNumber,
        transactionId: paymentResult.transactionId,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trimester,
        academicYear: student.school.academicYear
      });

      res.status(200).json({
        status: 'success',
        message: paymentResult.message || 'Paiement initié avec succès',
        data: {
          payment,
          paymentUrl: paymentResult.paymentUrl,
          ussdCode: paymentResult.ussdCode
        }
      });
    } else {
      // Direct payment (cash, bank transfer, etc.)
      payment = await Payment.create({
        parent: parent._id,
        student: studentId,
        school: student.school._id,
        amount,
        amountPaid: amount,
        paymentMethod,
        status: 'completed',
        dueDate: new Date(),
        paidDate: new Date(),
        trimester,
        academicYear: student.school.academicYear
      });

      await Parent.findByIdAndUpdate(parent._id, {
        paymentStatus: 'paid',
        lastPaymentDate: new Date(),
        amountPaid: (parent.amountPaid || 0) + amount
      });

      res.status(201).json({
        status: 'success',
        message: 'Paiement enregistré avec succès',
        data: {
          payment
        }
      });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId })
      .populate('student', 'firstName lastName')
      .populate('parent', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Paiement non trouvé'
      });
    }

    if (payment.paymentMethod === 'mobile_money') {
      const verification = await verifyMobileMoneyPayment(transactionId);
      
      if (verification.status === 'completed' && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.amountPaid = payment.amount;
        payment.paidDate = new Date();
        await payment.save();

        const parent = await Parent.findById(payment.parent._id);
        await Parent.findByIdAndUpdate(payment.parent._id, {
          paymentStatus: 'paid',
          lastPaymentDate: new Date(),
          amountPaid: (parent.amountPaid || 0) + payment.amount
        });

        return res.status(200).json({
          status: 'success',
          message: 'Paiement confirmé avec succès',
          data: {
            payment,
            verification
          }
        });
      } else if (verification.status === 'failed') {
        payment.status = 'failed';
        await payment.save();
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return res.status(404).json({
        status: 'error',
        message: 'Parent non trouvé'
      });
    }

    const payments = await Payment.find({ parent: parent._id })
      .populate('student', 'firstName lastName studentId')
      .populate('school', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

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

    const hasAccess = parent.children.some(child => 
      child.student.toString() === studentId
    );

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé'
      });
    }

    const currentPayment = await Payment.findOne({
      parent: parent._id,
      student: studentId,
      status: { $in: ['pending', 'completed'] }
    })
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        parentStatus: parent.paymentStatus,
        currentPayment
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getOverduePayments = async (req, res) => {
  try {
    const schoolId = req.user.school;

    const overduePayments = await Payment.find({
      school: schoolId,
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: new Date() }
    })
      .populate('parent', 'firstName lastName email phone')
      .populate('student', 'firstName lastName studentId')
      .sort({ dueDate: 1 });

    res.status(200).json({
      status: 'success',
      results: overduePayments.length,
      data: {
        payments: overduePayments
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const schoolId = req.user.school;

    // Total payments
    const totalPayments = await Payment.countDocuments({ school: schoolId });

    // Payments by status
    const paymentsByStatus = await Payment.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    // Total revenue
    const revenueStats = await Payment.aggregate([
      { $match: { school: schoolId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountPaid' },
          averagePayment: { $avg: '$amountPaid' }
        }
      }
    ]);

    // Monthly revenue
    const monthlyRevenue = await Payment.aggregate([
      { $match: { school: schoolId, status: 'completed', paidDate: { $ne: null } } },
      {
        $group: {
          _id: { 
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' }
          },
          revenue: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Payment methods distribution
    const paymentMethods = await Payment.aggregate([
      { $match: { school: schoolId, status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amountPaid' } } }
    ]);

    const stats = {
      overview: {
        totalPayments,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averagePayment: revenueStats[0]?.averagePayment || 0
      },
      paymentsByStatus,
      monthlyRevenue,
      paymentMethods
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amountPaid, notes } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Paiement non trouvé'
      });
    }

    payment.status = status;
    if (amountPaid !== undefined) {
      payment.amountPaid = amountPaid;
    }
    if (status === 'completed' && !payment.paidDate) {
      payment.paidDate = new Date();
    }
    if (notes) {
      payment.notes = notes;
    }

    await payment.save();

    // Update parent payment status
    if (status === 'completed') {
      const parent = await Parent.findById(payment.parent);
      if (parent) {
        await Parent.findByIdAndUpdate(payment.parent, {
          paymentStatus: 'paid',
          lastPaymentDate: new Date(),
          amountPaid: (parent.amountPaid || 0) + (amountPaid || 0)
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Statut du paiement mis à jour',
      data: {
        payment
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.handleMobileMoneyWebhook = async (req, res) => {
  try {
    console.log('Mobile Money Webhook received:', req.body);
    
    const { transactionId, status, amount, provider } = req.body;

    const payment = await Payment.findOne({ transactionId });
    
    if (!payment) {
      console.error('Payment not found for transaction:', transactionId);
      return res.status(404).json({
        status: 'error',
        message: 'Paiement non trouvé'
      });
    }

    if (status === 'success' || status === 'completed' || status === 'approved') {
      payment.status = 'completed';
      payment.amountPaid = amount || payment.amount;
      payment.paidDate = new Date();
      await payment.save();

      const parent = await Parent.findById(payment.parent);
      if (parent) {
        await Parent.findByIdAndUpdate(payment.parent, {
          paymentStatus: 'paid',
          lastPaymentDate: new Date(),
          amountPaid: (parent.amountPaid || 0) + (amount || payment.amount)
        });
      }

      console.log('Payment completed successfully:', transactionId);
    } else if (status === 'failed' || status === 'cancelled') {
      payment.status = 'failed';
      await payment.save();
      console.log('Payment failed:', transactionId);
    }

    res.status(200).json({
      status: 'success',
      message: 'Webhook traité avec succès'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('parent', 'firstName lastName email phone')
      .populate('student', 'firstName lastName studentId')
      .populate('school', 'name address phone logo');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Paiement non trouvé'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Le reçu ne peut être généré que pour les paiements complétés'
      });
    }

    // Generate PDF receipt
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=recu-${payment.transactionId || payment._id}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
       .text('REÇU DE PAIEMENT', { align: 'center' });
    doc.moveDown();

    // School info
    if (payment.school) {
      doc.fontSize(12).font('Helvetica');
      doc.text(payment.school.name, { align: 'center' });
      if (payment.school.address) {
        doc.text(payment.school.address, { align: 'center' });
      }
      if (payment.school.phone) {
        doc.text(`Tél: ${payment.school.phone}`, { align: 'center' });
      }
      doc.moveDown(2);
    }

    // Receipt number and date
    doc.fontSize(10);
    doc.text(`N° Reçu: ${payment._id}`, 50);
    doc.text(`Date: ${(payment.paidDate || new Date()).toLocaleDateString('fr-FR')}`, 50);
    doc.moveDown();

    // Parent and student info
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMATIONS');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Parent: ${payment.parent.firstName} ${payment.parent.lastName}`);
    doc.text(`Élève: ${payment.student.firstName} ${payment.student.lastName}`);
    doc.text(`Matricule: ${payment.student.studentId}`);
    if (payment.trimester) {
      doc.text(`Trimestre: ${payment.trimester}`);
    }
    doc.moveDown();

    // Payment details
    doc.fontSize(12).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Montant: ${payment.amount.toLocaleString('fr-FR')} FCFA`);
    doc.text(`Montant payé: ${payment.amountPaid.toLocaleString('fr-FR')} FCFA`);
    doc.text(`Méthode: ${payment.paymentMethod}`);
    if (payment.transactionId) {
      doc.text(`Transaction ID: ${payment.transactionId}`);
    }
    doc.moveDown(2);

    // Signature
    doc.fontSize(10);
    doc.text('Signature du caissier: ____________________', { align: 'right' });
    doc.moveDown();
    doc.text('Cachet de l\'établissement', { align: 'right' });

    // Footer
    doc.fontSize(8).fillColor('gray')
       .text('Ce reçu est généré électroniquement et ne nécessite pas de signature', 50, 750, { 
         align: 'center',
         width: 500 
       });

    doc.end();
  } catch (error) {
    console.error('Receipt generation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};