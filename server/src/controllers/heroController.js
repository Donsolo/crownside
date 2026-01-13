const prisma = require('../prisma');

const getHeroes = async (req, res) => {
    try {
        console.log('Attempting to fetch heroes...');
        if (!prisma.pageHero) {
            throw new Error('prisma.pageHero is undefined. Did you run npx prisma generate?');
        }
        const heroes = await prisma.pageHero.findMany();
        console.log('Heroes fetched:', heroes);
        res.json(heroes);
    } catch (error) {
        console.error('getHeroes Error Details:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch heroes', details: error.message });
    }
};

const updateHero = async (req, res) => {
    const { pageKey } = req.params;
    let { enabled } = req.body;

    let updateData = {};

    // Parse boolean if it comes as string
    if (enabled !== undefined) {
        updateData.enabled = enabled === 'true' || enabled === true;
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000';

    if (req.files && req.files['desktopImage']) {
        updateData.desktopImageUrl = `${baseUrl}/uploads/${req.files['desktopImage'][0].filename}`;
    }
    if (req.files && req.files['mobileImage']) {
        updateData.mobileImageUrl = `${baseUrl}/uploads/${req.files['mobileImage'][0].filename}`;
    }

    try {
        const hero = await prisma.pageHero.upsert({
            where: { pageKey },
            update: updateData,
            create: {
                pageKey,
                enabled: updateData.enabled ?? true,
                desktopImageUrl: updateData.desktopImageUrl,
                mobileImageUrl: updateData.mobileImageUrl
            }
        });
        res.json(hero);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update hero' });
    }
};

module.exports = { getHeroes, updateHero };
