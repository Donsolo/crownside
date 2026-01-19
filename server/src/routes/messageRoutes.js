const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create or Get Conversation (Idempotent)
router.post('/', messageController.getOrCreateConversation);

// Get Unread Count
router.get('/unread-count', messageController.getUnreadCount);

// Get Conversation Details & Messages
router.get('/:conversationId', messageController.getConversation);

// Send Message
router.post('/:conversationId/messages', messageController.sendMessage);

// Mark as Read
router.put('/:conversationId/read', messageController.markAsRead);

module.exports = router;
