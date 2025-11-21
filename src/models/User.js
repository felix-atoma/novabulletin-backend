// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  role: {
    type: String,
    required: true,
    enum: ['admin', 'director', 'teacher', 'parent', 'student']
  },
  phone: {
    type: String
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Auto-approve admins and directors
userSchema.pre('save', function(next) {
  if (this.role === 'admin' || this.role === 'director') {
    this.registrationStatus = 'approved';
    this.isActive = true;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);