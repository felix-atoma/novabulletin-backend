// models/StudentRegistration.js
const mongoose = require('mongoose');

const studentRegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false
  },
  registrationData: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    level: String,
    series: String
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentRegistration', studentRegistrationSchema);