const SpamLink = require('../models/SpamLink');

function extractDomain(url) {
  try {
    const normalized = url.startsWith('http') ? url : `http://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
}

// POST /api/links/report
exports.reportLink = async (req, res) => {
  try {
    const { url, category } = req.body;

    if (!url || url.trim().length === 0) {
      return res.status(400).json({ error: 'url is required' });
    }

    const domain = extractDomain(url);
    let record = await SpamLink.findOne({ url });

    if (record) {
      // Same user reporting the same link twice doesn't inflate the count
      if (!req.userId || !record.reportedBy.some(id => id.toString() === req.userId)) {
        record.reportCount += 1;
        if (req.userId) record.reportedBy.push(req.userId);
        await record.save();
      }
    } else {
      record = await SpamLink.create({
        url,
        domain,
        category: category || 'other',
        reportedBy: req.userId ? [req.userId] : []
      });
    }

    res.status(201).json({ message: 'Link reported', data: record });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// GET /api/links/check?url=...
exports.checkLink = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url query param is required' });

    const domain = extractDomain(url);

    // Check exact URL match first, then fall back to domain-level match
    let record = await SpamLink.findOne({ url });
    if (!record) {
      record = await SpamLink.findOne({ domain });
    }

    if (!record) {
      return res.json({ url, isSpam: false, reportCount: 0 });
    }

    res.json({
      url,
      isSpam: record.reportCount >= 3 || record.safeBrowsingFlagged,
      domain: record.domain,
      category: record.category,
      reportCount: record.reportCount,
      safeBrowsingFlagged: record.safeBrowsingFlagged
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
