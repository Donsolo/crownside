const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'googlesylist@tektriq.com';
  const password = 'Password1';
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    // Create the User
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        role: 'STYLIST',
        password: hashedPassword,
        displayName: 'Google Reviewer'
      },
      create: {
        email: email,
        password: hashedPassword,
        role: 'STYLIST',
        displayName: 'Google Reviewer',
      },
    });

    console.log('User created/updated:', user.id);

    // Create the StylistProfile
    const stylistProfile = await prisma.stylistProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: 'Google Reviewer Studio',
        bio: 'Official Google Play Store Review Account',
      },
      create: {
        userId: user.id,
        businessName: 'Google Reviewer Studio',
        bio: 'Official Google Play Store Review Account',
        locationType: 'STUDIO'
      },
    });

    console.log('StylistProfile created/updated:', stylistProfile.id);

    // Assign the Premier Subscription
    // Check if subscription exists
    const existingSub = await prisma.professionalSubscription.findFirst({
      where: { stylistId: stylistProfile.id }
    });

    if (existingSub) {
      await prisma.professionalSubscription.update({
        where: { id: existingSub.id },
        data: {
          planKey: 'premier',
          status: 'ACTIVE',
          billingStartsAt: new Date(),
          trialEndsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)) // Valid for 10 years
        }
      });
      console.log('Subscription updated to Premier');
    } else {
      await prisma.professionalSubscription.create({
        data: {
          stylistId: stylistProfile.id,
          planKey: 'premier',
          status: 'ACTIVE',
          billingStartsAt: new Date(),
          trialEndsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)) // Valid for 10 years
        }
      });
      console.log('Subscription created as Premier');
    }

    console.log('Successfully setup googlesylist@tektriq.com as a Premier Stylist.');

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
