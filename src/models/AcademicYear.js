const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  trimesters: {
    first: {
      start: Date,
      end: Date
    },
    second: {
      start: Date,
      end: Date
    },
    third: {
      start: Date,
      end: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);