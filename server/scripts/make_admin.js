const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_EMAIL = 'tektriq@gmail.com';

async function main() {
    console.log(`Checking for user: ${TARGET_EMAIL}...`);

    const user = await prisma.user.findUnique({
        where: { email: TARGET_EMAIL },
    });

    if (!user) {
        console.log(`User ${TARGET_EMAIL} not found.`);
        return;
    }

    if (user.role === 'ADMIN') {
        console.log(`User ${TARGET_EMAIL} is already an ADMIN.`);
        return;
    }

    await prisma.user.update({
        where: { email: TARGET_EMAIL },
        data: { role: 'ADMIN' },
    });

    console.log(`SUCCESS: User ${TARGET_EMAIL} has been promoted to ADMIN.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
