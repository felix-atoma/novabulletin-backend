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
  // New fields for Togolese system
  interrogation1: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  interrogation2: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  interrogation3: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  composition: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  // Calculated moyenne (trimester average)
  note: {
    type: Number,
    min: 0,
    max: 20,
    default: null
  },
  appreciation: {
    type: String,
    trim: true
  },
  coefficient: {
    type: Number,
    default: 1,
    min: 0.5,
    max: 10
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
  },
  lastModified: {
    type: Date,
    default: Date.now
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

// Index for querying by class and trimester
gradeSchema.index({ class: 1, trimester: 1 });

// Index for querying by student
gradeSchema.index({ student: 1, trimester: 1 });

// Pre-save middleware to calculate moyenne automatically
gradeSchema.pre('save', function(next) {
  // Calculate moyenne if we have the required grades
  const notes = [];
  
  if (this.interrogation1 !== null && this.interrogation1 !== undefined) {
    notes.push(this.interrogation1);
  }
  if (this.interrogation2 !== null && this.interrogation2 !== undefined) {
    notes.push(this.interrogation2);
  }
  if (this.interrogation3 !== null && this.interrogation3 !== undefined) {
    notes.push(this.interrogation3);
  }
  
  // Add composition with weight of 2
  if (this.composition !== null && this.composition !== undefined) {
    notes.push(this.composition * 2);
  }
  
  // Calculate moyenne if we have at least 2 interrogations + composition
  if (notes.length >= 3) {
    const sum = notes.reduce((acc, val) => acc + val, 0);
    const divisor = (this.interrogation3 !== null && this.interrogation3 !== undefined) ? 4 : 3;
    this.note = parseFloat((sum / divisor).toFixed(2));
  } else {
    this.note = null;
  }
  
  this.lastModified = new Date();
  next();
});

// Virtual to check if grade is complete
gradeSchema.virtual('isComplete').get(function() {
  return (
    this.interrogation1 !== null &&
    this.interrogation2 !== null &&
    this.composition !== null
  );
});

// Virtual to get mention based on moyenne
gradeSchema.virtual('mention').get(function() {
  if (this.note === null || this.note === undefined) return 'Non évalué';
  if (this.note >= 16) return 'Très Bien';
  if (this.note >= 14) return 'Bien';
  if (this.note >= 12) return 'Assez Bien';
  if (this.note >= 10) return 'Passable';
  return 'Insuffisant';
});

// Method to format grade for display
gradeSchema.methods.getFormattedGrade = function() {
  return {
    interrogation1: this.interrogation1?.toFixed(2) || '-',
    interrogation2: this.interrogation2?.toFixed(2) || '-',
    interrogation3: this.interrogation3?.toFixed(2) || '-',
    composition: this.composition?.toFixed(2) || '-',
    moyenne: this.note?.toFixed(2) || '-',
    coefficient: this.coefficient,
    mention: this.mention,
    appreciation: this.appreciation || '',
    isComplete: this.isComplete
  };
};

// Static method to calculate class statistics
gradeSchema.statics.getClassStatistics = async function(classId, subjectId, trimester) {
  const grades = await this.find({
    class: classId,
    subject: subjectId,
    trimester: trimester,
    note: { $ne: null }
  });

  if (grades.length === 0) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      passRate: 0
    };
  }

  const notes = grades.map(g => g.note);
  const sum = notes.reduce((acc, val) => acc + val, 0);
  const average = sum / notes.length;
  const passed = notes.filter(n => n >= 10).length;

  return {
    count: grades.length,
    average: parseFloat(average.toFixed(2)),
    highest: Math.max(...notes),
    lowest: Math.min(...notes),
    passRate: parseFloat(((passed / grades.length) * 100).toFixed(2))
  };
};

// Ensure virtuals are included in JSON
gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

// ⚡ Prevent OverwriteModelError
module.exports = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);