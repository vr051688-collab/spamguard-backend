const express = require('express');
const router = express.Router();
const { reportLink, checkLink } = require('../controllers/linkController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/report', authMiddleware, reportLink);
router.get('/check', checkLink);

module.exports = router;
