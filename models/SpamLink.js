const mongoose = require('mongoose');

const spamLinkSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    domain: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['phishing', 'malware', 'fake_kyc', 'lottery_scam', 'other'],
      default: 'other'
    },
    reportCount: {
      type: Number,
      default: 1
    },
    reportedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    safeBrowsingFlagged: {
      // Set true if Google Safe Browsing API also flagged this URL
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

spamLinkSchema.index({ url: 1 }, { unique: true });

module.exports = mongoose.model('SpamLink', spamLinkSchema);
