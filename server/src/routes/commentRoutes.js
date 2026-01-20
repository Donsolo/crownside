const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// Comments are typically associated with a post
// POST /api/comments/:postId -> Create comment
router.post('/:postId', authenticateToken, commentController.createComment);

// GET /api/comments/:postId -> Get comments for a post
// Public access allowed? User requested "Public commenting without login" is a NON-GOAL.
// But viewing comments might be public.
// Implementation Plan said: "Fetch comments... check if current user liked".
// If public, we need to handle optional auth middleware or manual check in controller.
// For now, let's keep it authenticated for simplicity or use optional auth if available.
// Given strict community, maybe public view is fine, but controller expects req.user for likes.
// Let's make it public view, but like status will be false if not logged in.
// Controller code: `const userId = req.user ? req.user.id : null;` -> implies optional auth.
// We need a middleware that populates user if token exists, but doesn't block.
// `authenticateToken` usually blocks.
// I'll stick to full auth for now for Phase 2 strictness, or create a 'softAuth'.
// User request said: "WHO CAN VIEW: Everyone (public read-only)" for boards.
// So Comments should be viewable.
// I need a soft auth middleware.

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return next();

    const jwt = require('jsonwebtoken'); // Need to require here or pass it
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
    });
};

router.get('/:postId', optionalAuth, commentController.getComments);

// TOGGLE LIKE
// POST /api/comments/like -> Toggle like on any item?
// Or /api/likes
// Controller exports `toggleLike`.
// Let's assume a separate route for likes or put it here.
// Let's put it at /likes endpoint here?
// The file is commentRoutes. Maybe rename to interactionRoutes or just mount at /api/interactions?
// Or just mount at /api/comments for consistency.
// But likes apply to posts too.
// Let's add `POST /like` to this router.
router.post('/like', authenticateToken, commentController.toggleLike);

// DELETE /api/comments/:id -> User soft delete
router.delete('/:id', authenticateToken, commentController.deleteComment);

module.exports = router;
