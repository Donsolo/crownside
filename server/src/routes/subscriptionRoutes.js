const express = require('express');
const router = express.Router();
const { getPlans, selectPlan } = require('../controllers/subscriptionController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { blockNativeBilling } = require('../middleware/nativeBillingBlock');

// Public route to see plans (or could be Auth only, but Marketing pages might need it)
router.get('/', blockNativeBilling, getPlans);

// Protected: Stylist selects a plan
router.post('/subscribe', authenticateToken, authorizeRole(['STYLIST']), blockNativeBilling, selectPlan);

// Check Status - Not blocked so app can read features
const { getSubscriptionStatus, cancelSubscription } = require('../controllers/subscriptionController');
router.get('/status', authenticateToken, authorizeRole(['STYLIST']), getSubscriptionStatus);
router.post('/cancel', authenticateToken, authorizeRole(['STYLIST']), blockNativeBilling, cancelSubscription);

// Admin: Update plan details
const { adminUpdatePlan } = require('../controllers/subscriptionController');
router.put('/admin/plans/:key', authenticateToken, authorizeRole(['ADMIN']), blockNativeBilling, adminUpdatePlan);

module.exports = router;
