const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Beauty Pro Premier Plan...');

    const premierPlan = await prisma.subscriptionPlan.upsert({
        where: { key: 'premier' },
        update: {
            price: 49.99,
            description: 'Includes Hair, Nails, and Lash/Brow services.'
        },
        create: {
            key: 'premier',
            name: 'Beauty Pro Premier',
            price: 49.99,
            description: 'Includes Hair, Nails, and Lash/Brow services.',
            freeTrialDays: 30,
            freeSlotsLimit: 100 // Arbitrary higher limit or same as others
        }
    });

    console.log('Upserted Plan:', premierPlan);

    // Ensure others exist for completeness if running on fresh DB
    await prisma.subscriptionPlan.upsert({
        where: { key: 'pro' },
        update: {},
        create: {
            key: 'pro',
            name: 'Beauty Pro',
            price: 24.99,
            description: 'Single service category (Hair OR Nails OR Lash/Brow).'
        }
    });

    await prisma.subscriptionPlan.upsert({
        where: { key: 'elite' },
        update: {},
        create: {
            key: 'elite',
            name: 'Beauty Pro Elite',
            price: 34.99,
            description: 'Two service categories.'
        }
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
