const mongoose = require('mongoose');

const spamNumberSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['telemarketing', 'phishing', 'fraud', 'otp_scam', 'loan_scam', 'other'],
      default: 'other'
    },
    reportCount: {
      type: Number,
      default: 1
    },
    // Each report increments reportCount; store recent report snippets for context
    reports: [
      {
        reason: { type: String, maxlength: 300 },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reportedAt: { type: Date, default: Date.now }
      }
    ],
    riskScore: {
      // Derived: 0-100, computed from reportCount + category severity
      type: Number,
      default: 10
    }
  },
  { timestamps: true }
);

// One document per unique number
spamNumberSchema.index({ phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('SpamNumber', spamNumberSchema);
