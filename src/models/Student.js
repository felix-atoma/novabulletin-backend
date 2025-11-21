const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  photo: {
    type: String,
    default: null
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['maternelle', 'primaire', 'college', 'lycee']
  },
  series: {
    type: String,
    enum: ['A4', 'C', 'D', 'B', 'G', 'F', null],
    default: null
  },
  parents: [{
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian']
    }
  }],
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

studentSchema.index({ school: 1, class: 1 });
studentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Student', studentSchema);