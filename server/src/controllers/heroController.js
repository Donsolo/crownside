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

    // Use APP_URL if set (Production), otherwise fallback to request header origin or localhost
    let baseUrl = process.env.APP_URL || process.env.API_URL;

    if (!baseUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('WARNING: APP_URL not set in production. Image URLs may be broken.');
        }
        baseUrl = req.protocol + '://' + req.get('host'); // Fallback to request host
    }

    // Ensure no trailing slash
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

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
