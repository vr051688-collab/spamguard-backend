require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const numberRoutes = require('./routes/numberRoutes');
const linkRoutes = require('./routes/linkRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Global rate limit: 100 requests per 15 min per IP (protects free-tier DB)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ status: 'SpamGuard API running' });
});

app.use('/api/numbers', numberRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
