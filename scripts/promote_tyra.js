const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = 'Thelocssmothhair@gmail.com';

async function main() {
    console.log(`Starting promotion for: ${EMAIL}`);

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email: EMAIL }
    });

    if (!user) {
        console.error('User not found!');
        process.exit(1);
    }

    console.log(`User found: ${user.id} (${user.displayName})`);

    // 2. Ensure Stylist Profile Exists
    let stylist = await prisma.stylistProfile.findUnique({
        where: { userId: user.id }
    });

    if (!stylist) {
        console.log('Stylist profile not found. Creating default profile...');
        stylist = await prisma.stylistProfile.create({
            data: {
                userId: user.id,
                businessName: user.displayName || 'Tyra\'s Business',
                locationType: 'SALON',
                contactPreference: 'BOOKINGS_ONLY'
            }
        });
        console.log(`Stylist profile created: ${stylist.id}`);
    } else {
        console.log(`Stylist profile exists: ${stylist.id}`);
    }

    // 3. Upsert Subscription (Premier, Lifetime)
    // We use a far future date to simulate "Lifetime"
    const LIFETIME_END = new Date('2099-01-01');

    const sub = await prisma.professionalSubscription.upsert({
        where: { stylistId: stylist.id },
        update: {
            planKey: 'premier',
            status: 'ACTIVE',
            trialEndsAt: LIFETIME_END, // Overrides any trial logic
            inputStatus: 'ACTIVE',      // Ensure backend treats it as active
            stripeSubscriptionId: 'manual_lifetime_comp', // Marker for manual
            updatedAt: new Date()
        },
        create: {
            stylistId: stylist.id,
            planKey: 'premier',
            status: 'ACTIVE',
            trialEndsAt: LIFETIME_END,
            stripeSubscriptionId: 'manual_lifetime_comp'
        }
    });

    console.log('SUCCESS: Subscription updated!');
    console.log(sub);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
