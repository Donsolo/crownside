const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus, getAllBookings } = require('../controllers/bookingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole(['CLIENT']), createBooking);
router.get('/', authenticateToken, getMyBookings); // Both can view
router.put('/:id/status', authenticateToken, authorizeRole(['STYLIST']), updateBookingStatus);

router.get('/all', authenticateToken, authorizeRole(['ADMIN']), getAllBookings); // Admin only

module.exports = router;
