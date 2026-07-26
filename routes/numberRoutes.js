const express = require('express');
const router = express.Router();
const { reportNumber, checkNumber, topSpamNumbers } = require('../controllers/numberController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/report', authMiddleware, reportNumber);
router.get('/check/:number', checkNumber);
router.get('/top', topSpamNumbers);

module.exports = router;
