module.exports = {
    pro: {
        name: 'Beauty Pro',
        stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_placeholder_pro',
        amount: 2499, // cents
    },
    elite: {
        name: 'Beauty Pro Elite',
        stripePriceId: process.env.STRIPE_PRICE_ELITE || 'price_placeholder_elite',
        amount: 3499, // cents
    },
    premier: {
        name: 'Beauty Pro Premier',
        stripePriceId: process.env.STRIPE_PRICE_PREMIER || 'price_placeholder_premier',
        amount: 4999, // cents
    }
};
