const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
    ? Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const pricingTiers = require('../config/pricingTiers');

const createCustomer = async (email, paymentMethodId) => {
    if (!stripe) {
        console.log('[MOCK] Stripe createCustomer:', email);
        return { id: 'cus_mock_' + Date.now().toString(36) };
    }

    try {
        const customer = await stripe.customers.create({
            email,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        return customer;
    } catch (error) {
        console.error('Stripe Error:', error);
        // Don't crash for now, just return mock if configured to allow soft failures? 
        // No, if keys are present but fails, we should throw.
        throw new Error('Payment processing failed: ' + error.message);
    }
};

const createSubscription = async (customerId, planKey) => {
    const tier = pricingTiers[planKey];
    if (!tier) throw new Error('Invalid plan key');

    if (!stripe) {
        console.log(`[MOCK] Stripe createSubscription for ${customerId} on ${planKey}`);
        return {
            id: 'sub_mock_' + Date.now().toString(36),
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
        };
    }

    try {
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: tier.stripePriceId }],
            expand: ['latest_invoice.payment_intent'],
        });
        return subscription;
    } catch (error) {
        console.error('Stripe Sub Error:', error);
        throw error;
    }
};

const updateSubscriptionTier = async (subscriptionId, newPlanKey) => {
    const tier = pricingTiers[newPlanKey];
    if (!tier) throw new Error('Invalid plan key');

    if (!stripe) {
        console.log(`[MOCK] Stripe updateSubscription ${subscriptionId} to ${newPlanKey}`);
        return { id: subscriptionId, plan: tier };
    }

    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscription.items.data[0].id,
                price: tier.stripePriceId,
            }],
        });
        return updatedSubscription;
    } catch (error) {
        console.error('Stripe Update Error:', error);
        throw error;
    }
};

const cancelSubscription = async (subscriptionId) => {
    if (!stripe) {
        console.log(`[MOCK] Stripe cancelSubscription ${subscriptionId}`);
        return { status: 'canceled' };
    }

    try {
        return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
        console.error('Stripe Cancel Error:', error);
        throw error;
    }
};

module.exports = {
    createCustomer,
    createSubscription,
    updateSubscriptionTier,
    cancelSubscription
};
