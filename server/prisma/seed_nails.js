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
    console.log('🌱 Seeding Nail Techs and Services...');

    // Password for all: "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Polished & Primed (Nail Tech)
    const tech1Email = 'sarah@polished.com';
    let tech1User = await prisma.user.upsert({
        where: { email: tech1Email },
        update: {},
        create: {
            email: tech1Email,
            password: hashedPassword,
            role: 'STYLIST',
            stylistProfile: {
                create: {
                    businessName: 'Polished & Primed',
                    bio: 'Specialize in gel extensions and intricate nail art. Over 5 years of experience making Detroit hands beautiful.',
                    locationType: 'SALON',
                    specialties: ['nails'],
                    services: {
                        create: [
                            { name: 'Gel Manicure', price: 45.00, duration: 60, deposit: 10.00, category: 'nails' },
                            { name: 'Acrylic Full Set', price: 65.00, duration: 90, deposit: 20.00, category: 'nails' },
                            { name: 'Nail Art (Per Finger)', price: 5.00, duration: 15, deposit: 0.00, category: 'nails' }
                        ]
                    }
                }
            }
        }
    });
    console.log(`✅ Created/Found Tech: ${tech1Email}`);

    // 2. Create Claw Culture (Nail Tech)
    const tech2Email = 'jasmine@clawculture.com';
    let tech2User = await prisma.user.upsert({
        where: { email: tech2Email },
        update: {},
        create: {
            email: tech2Email,
            password: hashedPassword,
            role: 'STYLIST',
            stylistProfile: {
                create: {
                    businessName: 'Claw Culture',
                    bio: 'Mobile nail tech bringing the salon to you. Natural nail care specialist.',
                    locationType: 'MOBILE',
                    specialties: ['nails'],
                    services: {
                        create: [
                            { name: 'Classic Pedicure', price: 50.00, duration: 45, deposit: 15.00, category: 'nails' },
                            { name: 'Gel Pedicure', price: 65.00, duration: 60, deposit: 20.00, category: 'nails' },
                        ]
                    }
                }
            }
        }
    });

    console.log(`✅ Created/Found Tech: ${tech2Email}`);
    console.log('🌱 Seeding Completed!');
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
