const mongoose = require('mongoose');

const bulletinSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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
    required: true
  },
  grades: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    note: Number,
    coefficient: Number,
    appreciation: String,
    competence: String
  }],
  statistics: {
    average: Number,
    rank: Number,
    classAverage: Number,
    minScore: Number,
    maxScore: Number,
    mention: String,
    totalStudents: Number
  },
  generalAppreciation: {
    type: String,
    trim: true
  },
  teacherSignature: {
    type: String
  },
  directorSignature: {
    type: String
  },
  schoolStamp: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  accessedByParents: [{
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

bulletinSchema.index({ student: 1, trimester: 1 });
bulletinSchema.index({ class: 1, academicYear: 1 });

module.exports = mongoose.model('Bulletin', bulletinSchema);