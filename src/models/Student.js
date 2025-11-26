// src/models/Student.js
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
    enum: [
      // Maternelle
      'ps', 'ms', 'gs', // petite, moyenne, grande section
      // Primaire
      'cp', 'ce1', 'ce2', 'cm1', 'cm2',
      // Collège
      '6e', '5e', '4e', '3e',
      // Lycée général
      '2nde', '1ere', 'terminale',
      // Lycée technologique
      '2nde_tech', '1ere_tech', 'terminale_tech',
      // Lycée professionnel
      '2nde_pro', '1ere_pro', 'terminale_pro'
    ]
  },
  series: {
    type: String,
    enum: [
      // Général
      'générale', 
      // Série générale (bac général 2021+)
      'maths', 'physique-chimie', 'svt', 'ses', 'histoire-géo', 'langues', 'humanités',
      // Technologique
      'sti2d', 'stl', 'std2a', 'stmg', 'st2s', 'sthr', 's2tmd',
      // Professionnel
      'cuisine', 'commerce', 'electrotech', 'mecanique', 'assistance', 'logistique', null
    ],
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

module.exports = mongoose.model('Student', studentSchema);