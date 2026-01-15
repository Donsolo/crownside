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

        // Safe Default for Mobile/Frontend fallback
        const defaultHero = [{
            pageKey: 'home',
            enabled: true,
            desktopImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80',
            mobileImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80'
        }];

        // Return default instead of 500 to prevent mobile crash
        res.json(defaultHero);
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

    const { getFileUrl } = require('../utils/fileUrl');

    if (req.files && req.files['desktopImage']) {
        updateData.desktopImageUrl = getFileUrl(req, req.files['desktopImage'][0]);
    }
    if (req.files && req.files['mobileImage']) {
        updateData.mobileImageUrl = getFileUrl(req, req.files['mobileImage'][0]);
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
