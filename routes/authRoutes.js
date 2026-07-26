const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require('../controllers/authController');

// Tighter limit on auth endpoints to slow down brute-force/OTP-spam attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' }
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
