const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { createPost, getPosts, getPostDetails, updatePostStatus, reportPost, uploadImage } = require('../controllers/forumController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public Read Access (with optional auth for read tracking)
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostDetails);

// Protected Write Access
router.post('/upload', authenticateToken, upload.single('image'), uploadImage); // Image Upload
router.post('/', authenticateToken, createPost);
router.put('/:id/status', authenticateToken, updatePostStatus);
router.post('/:id/report', authenticateToken, reportPost);

module.exports = router;
