const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Public/Shared: Get availability (Clients need to see it too)
router.get('/:stylistId', availabilityController.getAvailability);

// Stylist Only: Manage Schedule
router.put('/schedule', authenticateToken, authorizeRole(['STYLIST']), availabilityController.updateSchedule);
router.post('/exception', authenticateToken, authorizeRole(['STYLIST']), availabilityController.addException);

module.exports = router;
