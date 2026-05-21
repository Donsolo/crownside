const express = require('express');
const router = express.Router();
const { createSubscriptionSession, handleWebhook } = require('../controllers/stripeController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { blockNativeBilling } = require('../middleware/nativeBillingBlock');

router.post('/create-subscription', authenticateToken, authorizeRole(['STYLIST']), blockNativeBilling, createSubscriptionSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
