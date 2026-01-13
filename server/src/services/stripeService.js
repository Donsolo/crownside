const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
    ? Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const createCustomer = async (email, paymentMethodId) => {
    if (!stripe) {
        console.log('[MOCK] Stripe createCustomer:', email);
        return { id: 'cus_mock_' + Date.now() };
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
        throw new Error('Payment processing failed');
    }
};

module.exports = { createCustomer };
