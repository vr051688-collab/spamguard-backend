const SpamNumber = require('../models/SpamNumber');

// Simple risk score: base by category + weight per report, capped at 100
const CATEGORY_WEIGHT = {
  fraud: 25,
  otp_scam: 25,
  phishing: 20,
  loan_scam: 15,
  telemarketing: 8,
  other: 10
};

function computeRiskScore(reportCount, category) {
  const weight = CATEGORY_WEIGHT[category] || 10;
  return Math.min(100, weight + reportCount * 4);
}

// POST /api/numbers/report
exports.reportNumber = async (req, res) => {
  try {
    const { phoneNumber, category, reason } = req.body;

    if (!phoneNumber || !/^\+?[0-9]{7,15}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Valid phoneNumber is required' });
    }

    let record = await SpamNumber.findOne({ phoneNumber });

    if (record) {
      record.reportCount += 1;
      if (reason) {
        record.reports.push({ reason, reportedBy: req.userId });
        // Keep only the most recent 20 report notes
        if (record.reports.length > 20) record.reports = record.reports.slice(-20);
      }
      record.riskScore = computeRiskScore(record.reportCount, record.category);
      await record.save();
    } else {
      record = await SpamNumber.create({
        phoneNumber,
        category: category || 'other',
        reports: reason ? [{ reason, reportedBy: req.userId }] : [],
        riskScore: computeRiskScore(1, category || 'other')
      });
    }

    res.status(201).json({ message: 'Report recorded', data: record });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// GET /api/numbers/check/:number
exports.checkNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const record = await SpamNumber.findOne({ phoneNumber: number });

    if (!record) {
      return res.json({ phoneNumber: number, isSpam: false, riskScore: 0, reportCount: 0 });
    }

    res.json({
      phoneNumber: record.phoneNumber,
      isSpam: record.riskScore >= 40,
      riskScore: record.riskScore,
      category: record.category,
      reportCount: record.reportCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// GET /api/numbers/top?limit=20
exports.topSpamNumbers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const records = await SpamNumber.find()
      .sort({ riskScore: -1, reportCount: -1 })
      .limit(limit)
      .select('phoneNumber category reportCount riskScore');

    res.json({ count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
