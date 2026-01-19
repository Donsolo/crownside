const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, updateBookingStatus, getAllBookings, cancelBooking } = require('../controllers/bookingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole(['CLIENT', 'STYLIST', 'ADMIN']), createBooking);
router.get('/', authenticateToken, getMyBookings); // Both can view
router.put('/:id/status', authenticateToken, authorizeRole(['STYLIST']), updateBookingStatus);
router.put('/:id/cancel', authenticateToken, authorizeRole(['CLIENT', 'STYLIST', 'ADMIN']), cancelBooking);
router.delete('/:id', authenticateToken, authorizeRole(['STYLIST', 'ADMIN']), require('../controllers/bookingController').deleteBooking);

router.get('/all', authenticateToken, authorizeRole(['ADMIN']), getAllBookings); // Admin only

module.exports = router;
