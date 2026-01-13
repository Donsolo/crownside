const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Start seeding ...');

    // Cleanup existing data
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.portfolioImage.deleteMany();
    await prisma.stylistProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create Client
    const clientPassword = await bcrypt.hash('client123', 10);
    const client = await prisma.user.create({
        data: {
            email: 'client@crownside.com',
            password: clientPassword,
            role: 'CLIENT',
        },
    });

    // Create Stylist 1 (Braids)
    const stylist1Password = await bcrypt.hash('stylist123', 10);
    const stylist1User = await prisma.user.create({
        data: {
            email: 'braids@crownside.com',
            password: stylist1Password,
            role: 'STYLIST',
        },
    });

    const stylist1Profile = await prisma.stylistProfile.create({
        data: {
            userId: stylist1User.id,
            businessName: 'Crown Braids Factory',
            bio: 'Specializing in knotless braids and twist styles. Over 5 years of experience in Detroit.',
            locationType: 'SALON',
            services: {
                create: [
                    { name: 'Small Knotless Box Braids', price: 250, duration: 300, deposit: 50 },
                    { name: 'Medium Knotless Box Braids', price: 200, duration: 240, deposit: 40 },
                    { name: 'Large Knotless Box Braids', price: 160, duration: 180, deposit: 30 },
                ],
            },
            portfolioImages: {
                create: [
                    { imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=400' },
                    { imageUrl: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=400' },
                ]
            }
        },
    });

    // Create Stylist 2 (Silk Press)
    const stylist2Password = await bcrypt.hash('stylist123', 10);
    const stylist2User = await prisma.user.create({
        data: {
            email: 'silk@crownside.com',
            password: stylist2Password,
            role: 'STYLIST',
        },
    });

    const stylist2Profile = await prisma.stylistProfile.create({
        data: {
            userId: stylist2User.id,
            businessName: 'Silky Smooth Studio',
            bio: 'Premier silk press and natural hair care specialist. Healthy hair is my priority.',
            locationType: 'HOME',
            services: {
                create: [
                    { name: 'Silk Press & Trim', price: 85, duration: 90, deposit: 25 },
                    { name: 'Deep Conditioning Treatment', price: 30, duration: 45, deposit: 0 },
                ],
            },
            portfolioImages: {
                create: [
                    { imageUrl: 'https://images.unsplash.com/photo-1562086967-ba4065646199?auto=format&fit=crop&q=80&w=400' },
                ]
            }
        },
    });

    // Create a Booking
    // Get a service from Stylist 1
    const service = await prisma.service.findFirst({ where: { stylistId: stylist1Profile.id } });

    const booking = await prisma.booking.create({
        data: {
            clientId: client.id,
            stylistId: stylist1Profile.id,
            serviceId: service.id,
            appointmentDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            status: 'PENDING',
            notes: 'Please be gentle with edges.'
        }
    });

    // Seed Subscription Plans
    console.log('Seeding Subscription Plans...');
    await prisma.subscriptionPlan.upsert({
        where: { key: 'pro' },
        update: {},
        create: {
            key: 'pro',
            name: 'Beauty Pro',
            price: 24.99,
            description: 'Hair OR Nails specialty. Free for first 30 days/pros.',
            freeTrialDays: 30,
            freeSlotsLimit: 30,
            active: true
        }
    });

    await prisma.subscriptionPlan.upsert({
        where: { key: 'elite' },
        update: {},
        create: {
            key: 'elite',
            name: 'Beauty Pro Elite',
            price: 34.99,
            description: 'Hair AND Nails specialties. Free for first 30 days/pros.',
            freeTrialDays: 30,
            freeSlotsLimit: 30,
            active: true
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
