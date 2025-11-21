// models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false
  },
  specialization: {
    type: String
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);