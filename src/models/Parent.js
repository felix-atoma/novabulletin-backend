// ...existing code...
const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  children: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian']
    }
  }],
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  profession: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'exempted'],
    default: 'pending'
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDue: {
    type: Date
  },
  totalAmountDue: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false // allow parent documents without an associated school during registration
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parent', parentSchema);
// ...existing code...