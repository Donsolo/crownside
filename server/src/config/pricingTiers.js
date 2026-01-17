module.exports = {
    pro: {
        name: 'Beauty Pro',
        stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_1SqPzIQ0ltEihVgP7QBBKiUw',
        amount: 1500, // $15.00
    },
    elite: {
        name: 'Beauty Pro Elite',
        stripePriceId: process.env.STRIPE_PRICE_ELITE || 'price_1SqQ2FQ0ltEihVgPbUPpHaH6',
        amount: 2500, // $25.00
    },
    premier: {
        name: 'Beauty Pro Premier',
        stripePriceId: process.env.STRIPE_PRICE_PREMIER || 'price_1SqQ2fQ0ltEihVgPT1ED1OC7',
        amount: 3500, // $35.00
    }
};
