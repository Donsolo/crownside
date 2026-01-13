const express = require('express');
const router = express.Router();
const { getPlans, selectPlan } = require('../controllers/subscriptionController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Public route to see plans (or could be Auth only, but Marketing pages might need it)
router.get('/', getPlans);

// Protected: Stylist selects a plan
router.post('/subscribe', authenticateToken, authorizeRole(['STYLIST']), selectPlan);

// Check Status
const { getSubscriptionStatus, cancelSubscription } = require('../controllers/subscriptionController');
router.get('/status', authenticateToken, authorizeRole(['STYLIST']), getSubscriptionStatus);
router.post('/cancel', authenticateToken, authorizeRole(['STYLIST']), cancelSubscription);

// Admin: Update plan details
const { adminUpdatePlan } = require('../controllers/subscriptionController');
router.put('/admin/plans/:key', authenticateToken, authorizeRole(['ADMIN']), adminUpdatePlan);

module.exports = router;
