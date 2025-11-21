// src/models/Classroom.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    enum: ['maternelle', 'primaire', 'college', 'lycee']
  },
  grade: {
    type: String,
    required: true
  },
  series: {
    type: String,
    enum: ['A4', 'C', 'D', 'B', 'G', 'F', null],
    default: null
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  capacity: {
    type: Number,
    default: 40
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  academicYear: {
    type: String,
    required: true,
    default: '2024-2025'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

classSchema.index({ school: 1, level: 1 });
classSchema.index({ teacher: 1 });

module.exports = mongoose.model('Class', classSchema);