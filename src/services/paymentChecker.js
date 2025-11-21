const Payment = require('../models/Payment');
const Parent = require('../models/Parent');

exports.checkPaymentStatus = async (parentId, studentId) => {
  const currentDate = new Date();
  
  const latestPayment = await Payment.findOne({
    parent: parentId,
    student: studentId,
    status: 'completed'
  }).sort({ paidDate: -1 });

  if (!latestPayment) {
    return {
      hasPaid: false,
      status: 'unpaid',
      message: 'Aucun paiement trouvé'
    };
  }

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (latestPayment.paidDate < threeMonthsAgo) {
    return {
      hasPaid: false,
      status: 'overdue',
      message: 'Paiement expiré',
      lastPayment: latestPayment.paidDate
    };
  }

  return {
    hasPaid: true,
    status: 'paid',
    message: 'Paiement à jour',
    lastPayment: latestPayment.paidDate
  };
};

exports.canAccessBulletins = async (parentId, studentId) => {
  const paymentStatus = await this.checkPaymentStatus(parentId, studentId);
  return paymentStatus.hasPaid;
};

exports.getPaymentAlerts = async (schoolId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overdueParents = await Parent.aggregate([
    {
      $match: {
        school: schoolId,
        paymentStatus: { $in: ['pending', 'overdue'] },
        $or: [
          { lastPaymentDate: { $lt: thirtyDaysAgo } },
          { lastPaymentDate: { $exists: false } }
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        parentName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
        email: '$userInfo.email',
        phone: '$userInfo.phone',
        paymentStatus: 1,
        lastPaymentDate: 1,
        amountDue: { $subtract: ['$totalAmountDue', '$amountPaid'] }
      }
    }
  ]);

  return overdueParents;
};