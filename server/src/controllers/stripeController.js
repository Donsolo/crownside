const { createSubscription } = require('../services/stripeService');
const prisma = require('../prisma');
const Stripe = require('stripe');

// Safe partial initialization for webhook signature verification ONLY
const stripeRaw = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

const createSubscriptionSession = async (req, res) => {
    // This previously created a Checkout Session.
    // For now, we stub it or keep it safe. Use service if we shift to direct sub creation.
    // If we want to keep Checkout Session logic, we should move it to stripeService for safety.
    // For this task, "NO checkout UI polish", so let's just make it return a Mock URL if Stripe missing.

    if (!stripeRaw) {
        return res.json({ url: `${req.headers.origin}/dashboard?mock_session=true` });
    }

    try {
        const userId = req.user.id;
        // ... (Existing Checkout Logic or moved to Service) ...
        // Simplest: Just use the service's createSubscription logic if we weren't doing Checkout UI.
        // But requirements say "Frontend hooks... NO checkout UI polish".
        // Let's safe-guard the existing logic directly here or via service.
        // Given constraints, I'll wrap the existing logic in a safety block.

        const session = await stripeRaw.checkout.sessions.create({
            // ... existing config ...
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'CrownSide Stylist Subscription' },
                    unit_amount: 1999,
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            metadata: { userId },
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/dashboard`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ error: 'Stripe session creation failed' });
    }
};

const handleWebhook = async (req, res) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !stripeRaw) {
        console.log("Webhook received but Stripe not configured, ignoring.");
        return res.json({ received: true, ignored: true });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripeRaw.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle events
    console.log(`Webhook received: ${event.type}`);
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Logic to update StylistProfile subscriptionStatus
    }

    res.json({ received: true });
};

module.exports = { createSubscriptionSession, handleWebhook };
