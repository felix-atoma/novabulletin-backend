const mongoose = require('mongoose');

/**
 * 🟢 Unified Level System to Match Real School Structure
 * and your existing test data (ce1, ce2, cm1, etc)
 */
const LEVELS = [
  // Maternelle
  'maternelle',

  // Primaire (your tests use these)
  'cp1', 'cp2',
  'ce1', 'ce2',
  'cm1', 'cm2',

  // Collège
  'college',

  // Lycée
  'seconde', 'premiere', 'terminale'
];

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la matière est requis'],
    trim: true
  },

  code: {
    type: String,
    required: [true, 'Le code de la matière est requis'],
    unique: true,
    uppercase: true,
    trim: true
  },

  level: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: LEVELS
  },

  /**
   * College specific grades
   */
  applicableGrades: [{
    type: String,
    enum: ['all', '6e', '5e', '4e', '3e']
  }],

  /**
   * Lycée series
   */
  series: [{
    type: String,
    enum: [
      'all',
      'A1', 'A2', 'A4',
      'B', 'C', 'D', 'S',
      'G1', 'G2',
      'F1', 'F2', 'F3', 'F4', 'F5'
    ]
  }],

  coefficient: {
    type: Number,
    required: [true, 'Le coefficient est requis'],
    min: [0.5, 'Le coefficient minimum est 0.5'],
    max: [10, 'Le coefficient maximum est 10'],
    default: 1
  },

  isMain: {
    type: Boolean,
    default: true
  },

  evaluationType: {
    type: String,
    enum: ['notes', 'competences', 'appreciation'],
    default: 'notes'
  },

  description: {
    type: String,
    trim: true
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

  color: {
    type: String,
    default: '#3B82F6'
  },

  icon: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

/**
 * Indexes
 */
subjectSchema.index({ school: 1, level: 1 });
subjectSchema.index({ school: 1, series: 1 });
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ name: 1, school: 1 });

/**
 * Virtual
 */
subjectSchema.virtual('displayName').get(function () {
  return `${this.name} (Coef. ${this.coefficient})`;
});

/**
 * Level Applicability Logic
 */
subjectSchema.methods.appliesTo = function (classLevel, classSeries, classGrade) {
  if (this.level !== classLevel) return false;

  // Collège
  if (classLevel === 'college') {
    return this.applicableGrades.includes('all') || this.applicableGrades.includes(classGrade);
  }

  // Lycée
  if (['seconde', 'premiere', 'terminale'].includes(classLevel)) {
    return this.series.includes('all') || this.series.includes(classSeries);
  }

  // Primaire & Maternelle
  return true;
};

/**
 * Auto-clean applicableGrades/series
 */
subjectSchema.pre('save', function (next) {
  if (!this.series || this.series.length === 0) {
    this.series = ['all'];
  }

  if (!this.applicableGrades || this.applicableGrades.length === 0) {
    this.applicableGrades = ['all'];
  }

  if (this.level === 'college' && this.applicableGrades.includes('all')) {
    this.applicableGrades = ['all'];
  }

  if (['seconde', 'premiere', 'terminale'].includes(this.level) && this.series.includes('all')) {
    this.series = ['all'];
  }

  next();
});

/**
 * API Format
 */
subjectSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    code: this.code,
    level: this.level,
    applicableGrades: this.applicableGrades,
    series: this.series,
    coefficient: this.coefficient,
    isMain: this.isMain,
    evaluationType: this.evaluationType,
    description: this.description,
    color: this.color,
    icon: this.icon,
    displayName: this.displayName,
    isActive: this.isActive
  };
};

subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
