const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'dariusreeder@gmail.com';
    console.log(`Promoting user ${email} to SHOWCASE Stylist (Premier Plan, Active Status)...`);

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update Role
    await prisma.user.update({
        where: { id: user.id },
        data: { role: 'STYLIST' }
    });
    console.log('Role updated to STYLIST.');

    // 3. Upsert StylistProfile
    const stylist = await prisma.stylistProfile.upsert({
        where: { userId: user.id },
        update: {
            subscriptionStatus: 'ACTIVE' // Force Active
        },
        create: {
            userId: user.id,
            businessName: user.displayName || 'Showcase Stylist',
            locationType: 'MOBILE',
            subscriptionStatus: 'ACTIVE',
            specialties: ['hair', 'nails', 'makeup']
        }
    });
    console.log(`Stylist Profile ready: ${stylist.id}`);

    // 4. Upsert ProfessionalSubscription (Force Review, Bypass Trial)
    // We use planKey: 'premier' for max access
    const sub = await prisma.professionalSubscription.upsert({
        where: { stylistId: stylist.id },
        update: {
            planKey: 'premier',
            status: 'ACTIVE',
            trialEndsAt: null, // No trial tracking
            billingStartsAt: new Date(), // Pretend billing started now
        },
        create: {
            stylistId: stylist.id,
            planKey: 'premier',
            status: 'ACTIVE',
            trialEndsAt: null,
            billingStartsAt: new Date()
        }
    });

    console.log('Subscription forced to PREMIER / ACTIVE.');
    console.log('Showcase setup complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
