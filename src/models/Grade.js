// src/models/Grade.js
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  trimester: {
    type: String,
    required: true,
    enum: ['first', 'second', 'third']
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024-2025'
  },
  note: {
    type: Number,
    min: 0,
    max: 20
  },
  appreciation: {
    type: String,
    trim: true
  },
  coefficient: {
    type: Number,
    default: 1,
    min: 0.5,
    max: 5
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique grades per student/subject/trimester
gradeSchema.index({ 
  student: 1, 
  subject: 1, 
  trimester: 1, 
  academicYear: 1 
}, { unique: true });

// ⚡ Prevent OverwriteModelError
module.exports = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);
