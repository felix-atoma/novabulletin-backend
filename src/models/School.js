// src/models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Togo'
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    logo: {
      type: String,
      default: null
    },

    director: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    levels: [
      {
        type: String,
        enum: ['maternelle', 'primaire', 'college', 'lycee']
      }
    ],

    academicYear: {
      type: String,
      default: '2024-2025'
    },

    paymentConfig: {
      primaryPrice: { type: Number, default: 100000 },
      collegePrice: { type: Number, default: 200000 },
      highSchoolPrice: { type: Number, default: 300000 }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('School', schoolSchema);
