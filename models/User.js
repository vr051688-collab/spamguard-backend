const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true // stored as bcrypt hash, never plaintext
    },
    name: {
      type: String,
      trim: true
    },
    // OTP fields for forgot-password flow
    resetOtp: {
      type: String,
      default: null
    },
    resetOtpExpiry: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
