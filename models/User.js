const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    default: ''
  },
  username: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  country: {
    type: String,
    default: 'Global',
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'USER'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  kycStatus: {
    type: String,
    default: 'UNVERIFIED'
  },
  kycData: {
    type: Object,
    default: {}
  },
  tradeOutcome: {
    type: String,
    default: 'DEFAULT',
    enum: ['DEFAULT', 'WIN', 'LOSS']
  },
  kycSubmittedAt: {
    type: Date
  },
  transactions: {
    type: Array,
    default: []
  },
  activePlans: {
    type: Array,
    default: []
  },
  activePlansCount: {
    type: Number,
    default: 0
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  referredBy: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Safe pre-save hook that prevents double-hashing
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  // Only hash if NOT already hashed (bcrypt hashes start with $2a$ or $2b$)
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
