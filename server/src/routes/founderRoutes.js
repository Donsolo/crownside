const express = require('express');
const router = express.Router();
const { acceptFounderInvite, inviteUserToFounders, removeUserFromFounders } = require('../controllers/founderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// POST /founders/accept
router.post('/accept', authenticateToken, acceptFounderInvite);

// POST /founders/admin/invite
router.post('/admin/invite', authenticateToken, authorizeRole(['ADMIN']), inviteUserToFounders);

// POST /founders/admin/remove
router.post('/admin/remove', authenticateToken, authorizeRole(['ADMIN']), removeUserFromFounders);

module.exports = router;
