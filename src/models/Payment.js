const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'cash', 'bank_transfer'],
    required: true
  },
  mobileMoneyProvider: {
    type: String,
    enum: ['mtn', 'moov', 'vodafone', null],
    default: null
  },
  phoneNumber: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  trimester: {
    type: String,
    enum: ['first', 'second', 'third', 'annual'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  receiptUrl: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);