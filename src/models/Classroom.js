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
    enum: [
      // Maternelle
      'ps', 'ms', 'gs',
      // Primaire
      'cp', 'ce1', 'ce2', 'cm1', 'cm2',
      // Collège
      '6e', '5e', '4e', '3e',
      // Lycée
      '2nde', '1ere', 'terminale'
    ]
  },
  series: {
    type: String,
    required: function() {
      // Les séries sont requises seulement pour le lycée
      return ['2nde', '1ere', 'terminale'].includes(this.level);
    },
    enum: ['A4', 'D', 'C', 'E', 'F', 'A2', null],
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
    default: 35,
    min: 1,
    max: 50
  },
  currentStudents: {
    type: Number,
    default: 0
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
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
classSchema.index({ school: 1, level: 1, series: 1 });
classSchema.index({ teacher: 1 });
classSchema.index({ academicYear: 1 });

// Méthode statique pour obtenir les statistiques de la classe
classSchema.statics.getClassStats = async function(classId) {
  const Student = require('./Student');
  const studentCount = await Student.countDocuments({ class: classId, isActive: true });
  
  return {
    studentCount,
    availableSpots: this.capacity - studentCount,
    occupancyRate: ((studentCount / this.capacity) * 100).toFixed(1)
  };
};

// Middleware pour mettre à jour le compteur d'élèves
classSchema.pre('save', async function(next) {
  if (this.isModified('capacity')) {
    const Student = require('./Student');
    const studentCount = await Student.countDocuments({ 
      class: this._id, 
      isActive: true 
    });
    this.currentStudents = studentCount;
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);