// Simple shared-secret auth for write endpoints (report submissions).
// The Android app sends this key in a header. Rotate it if it ever leaks.
module.exports = function apiKeyAuth(req, res, next) {
  const key = req.header('x-api-key');

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};
