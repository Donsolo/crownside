const express = require('express');
const { logVisit, getTrafficStats } = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Public: Log a visit (fire & forget)
router.post('/visit', logVisit);

// Admin: Get stats
router.get('/stats', authenticateToken, authorizeRole(['ADMIN']), getTrafficStats);

module.exports = router;
