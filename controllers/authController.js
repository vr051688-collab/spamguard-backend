const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/sendEmail');

const OTP_EXPIRY_MINUTES = 10;

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function generateOtp() {
  // 6-digit numeric OTP
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/auth/forgot-password — generates OTP, emails it via Gmail
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether the email exists — generic response either way
      return res.json({ message: 'If that email is registered, an OTP has been sent' });
    }

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.json({ message: 'If that email is registered, an OTP has been sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }
    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP has expired, request a new one' });
    }

    res.json({ message: 'OTP verified — you may now reset your password' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.resetOtp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP has expired, request a new one' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful — you can now log in' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
