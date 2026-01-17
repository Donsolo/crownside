const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
    ? Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const pricingTiers = require('../config/pricingTiers');

const createCustomer = async (email, paymentMethodId) => {
    if (!stripe) {
        throw new Error('Stripe is not configured (Missing STRIPE_SECRET_KEY)');
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
        console.error('Stripe createCustomer Error:', error);
        throw new Error('Payment processing failed: ' + error.message);
    }
};

const createSubscription = async (customerId, planKey) => {
    const tier = pricingTiers[planKey];
    if (!tier) throw new Error('Invalid plan key');

    if (!stripe) {
        throw new Error('Stripe is not configured (Missing STRIPE_SECRET_KEY)');
    }

    try {
        const subscriptionParams = {
            customer: customerId,
            items: [{ price: tier.stripePriceId }],
            expand: ['latest_invoice.payment_intent'],
        };

        // Business Rule: Only 'pro' gets 30-day trial automatically
        if (planKey === 'pro') {
            subscriptionParams.trial_period_days = 30;
        }

        const subscription = await stripe.subscriptions.create(subscriptionParams);
        return subscription;
    } catch (error) {
        console.error('Stripe createSubscription Error:', error);
        throw error;
    }
};

const updateSubscriptionTier = async (subscriptionId, newPlanKey) => {
    const tier = pricingTiers[newPlanKey];
    if (!tier) throw new Error('Invalid plan key');

    if (!stripe) {
        throw new Error('Stripe is not configured (Missing STRIPE_SECRET_KEY)');
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
        throw new Error('Stripe is not configured (Missing STRIPE_SECRET_KEY)');
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
