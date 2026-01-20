const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Dedicated Moderator Role Access
const ALLOWED_ROLES = ['ADMIN', 'MODERATOR'];

// Get Reports Queue
router.get('/reports', authenticateToken, authorizeRole(ALLOWED_ROLES), moderationController.getReportQueue);

// Perform Action (Lock, Remove, Resolve, Mute, Dismiss)
router.post('/action', authenticateToken, authorizeRole(ALLOWED_ROLES), moderationController.performAction);

module.exports = router;
