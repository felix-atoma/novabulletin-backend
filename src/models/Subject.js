// src/models/Subject.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  coefficient: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5
  },
  level: {
    type: String,
    required: true,
    enum: ['maternelle', 'primaire', 'college', 'lycee']
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);