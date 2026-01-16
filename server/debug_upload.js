const prisma = require('./src/prisma');
const fs = require('fs');
const path = require('path');

async function test() {
    console.log('--- STARTING DEBUG ---');

    // 1. Check Uploads Dir
    try {
        const uploadDir = path.join(__dirname, 'src/uploads'); // Check src/uploads or root uploads?
        // App uses: app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
        // And middleware uses: 'uploads/' relative to CWD.
        // Let's check root 'uploads/'
        const rootUploads = path.join(__dirname, 'uploads');
        console.log(`Checking uploads dir at: ${rootUploads}`);

        if (!fs.existsSync(rootUploads)) {
            console.log('Uploads dir does not exist. Creating...');
            fs.mkdirSync(rootUploads);
        }

        const testFile = path.join(rootUploads, 'test_write.txt');
        fs.writeFileSync(testFile, 'test');
        console.log('✅ File system write success');
        fs.unlinkSync(testFile);
    } catch (e) {
        console.error('❌ File system write failed:', e.message);
    }

    // 2. Check DB
    try {
        console.log('Checking DB Connection...');
        const userCount = await prisma.user.count();
        console.log(`✅ Users in DB: ${userCount}`);

        const stylist = await prisma.stylistProfile.findFirst();
        if (stylist) {
            console.log(`✅ Found a stylist: ${stylist.id}`);

            // Try explicit query that failed for user
            try {
                const fetchedStylist = await prisma.stylistProfile.findUnique({ where: { userId: stylist.userId } });
                console.log(`✅ findUnique stylist by userId success`);
            } catch (e) {
                console.error(`❌ findUnique stylist failed:`, e.message);
            }

        } else {
            console.log('⚠️ No stylists found in DB');
        }

        // Check Portfolio Table
        try {
            const count = await prisma.portfolioImage.count();
            console.log(`✅ PortfolioImage table exists. Count: ${count}`);

            // Try to create dummy if stylist exists
            if (stylist) {
                const img = await prisma.portfolioImage.create({
                    data: {
                        stylistId: stylist.id,
                        imageUrl: 'http://debug.test/img.jpg'
                    }
                });
                console.log(`✅ PortfolioImage create success: ${img.id}`);
                await prisma.portfolioImage.delete({ where: { id: img.id } });
            }
        } catch (e) {
            console.error('❌ PortfolioImage table error (Missing migration?):', e.message);
        }

    } catch (e) {
        console.error('❌ DB Fatal Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
