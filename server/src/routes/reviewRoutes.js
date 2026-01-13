const express = require('express');
const router = express.Router();
const { createReview, getStylistReviews, replyToReview, getAllReviews } = require('../controllers/reviewController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole(['CLIENT']), createReview);
router.get('/stylist/:stylistId', getStylistReviews); // Public access to read
router.put('/:reviewId/reply', authenticateToken, authorizeRole(['STYLIST']), replyToReview);

router.get('/all', authenticateToken, authorizeRole(['ADMIN']), getAllReviews);

module.exports = router;
