const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("WARNING: STRIPE_SECRET_KEY is missing. Stripe functionality will fail.");
}
const stripe = require('stripe')(stripeKey);
const prisma = require('../prisma');

const createSubscriptionSession = async (req, res) => {
    const userId = req.user.id;
    try {
        const session = await stripe.checkout.sessions.create({
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
        res.status(500).json({ error: 'Stripe session creation failed' });
    }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle events
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Activate subscription in DB
        if (session.mode === 'subscription') {
            // Logic to update StylistProfile subscriptionStatus
        }
    }

    res.json({ received: true });
};

module.exports = { createSubscriptionSession, handleWebhook };
