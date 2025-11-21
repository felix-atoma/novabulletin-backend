const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema({
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
  averages: {
    general: Number,
    bySubject: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      average: Number,
      coefficient: Number
    }]
  },
  rank: Number,
  classAverage: Number,
  minScore: Number,
  maxScore: Number,
  mention: String,
  attendance: {
    present: Number,
    absent: Number,
    percentage: Number
  },
  behavior: {
    type: String,
    enum: ['excellent', 'good', 'satisfactory', 'needs_improvement']
  }
}, {
  timestamps: true
});

statisticsSchema.index({ student: 1, trimester: 1 });
statisticsSchema.index({ class: 1, academicYear: 1 });

module.exports = mongoose.model('Statistics', statisticsSchema);