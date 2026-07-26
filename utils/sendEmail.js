const nodemailer = require('nodemailer');

// Gmail SMTP transport. Needs an App Password (not the real Gmail password) —
// generate one at myaccount.google.com/apppasswords, requires 2FA enabled.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"SpamGuard" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'SpamGuard — Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">SpamGuard Password Reset</h2>
        <p>Your one-time password (OTP) is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #D62828;">${otp}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
