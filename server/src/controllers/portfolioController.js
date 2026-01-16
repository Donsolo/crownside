const prisma = require('../prisma');

const addPortfolioImage = async (req, res) => {
    const userId = req.user.id;
    let { imageUrl } = req.body;

    // Handle File Upload
    const { getFileUrl } = require('../utils/fileUrl');

    if (req.file) {
        imageUrl = getFileUrl(req, req.file);
    }

    if (!imageUrl) return res.status(400).json({ error: 'Image is required' });

    try {
        const stylist = await prisma.stylistProfile.findUnique({
            where: { userId },
            include: { portfolioImages: true, subscription: true }
        });
        if (!stylist) return res.status(404).json({ error: 'Stylist profile not found' });

        const { SUBSCRIPTION_TIERS } = require('../config/constants');

        // Determine Limit based on Tier
        const planKey = stylist.subscription?.planKey?.toUpperCase() || 'PRO';
        const tierConfig = SUBSCRIPTION_TIERS[planKey] || SUBSCRIPTION_TIERS.PRO;
        const maxPhotos = tierConfig.photoLimit;

        if (stylist.portfolioImages.length >= maxPhotos) {
            return res.status(400).json({
                error: `Portfolio limit reached (${maxPhotos} items max for ${tierConfig.label})`,
                code: 'LIMIT_REACHED'
            });
        }

        // Check for Video Restriction
        const isVideo = imageUrl.match(/\.(mp4|mov|avi|webm)$/i);
        if (isVideo && !tierConfig.videoAllowed) {
            // If a file was uploaded, delete it from storage
            // If a file was uploaded, we should ideally delete it.
            // TODO: Implement file cleanup for rejected uploads.
            // if (req.file) { ... }
            return res.status(403).json({
                error: `Video uploads are not available on the ${tierConfig.label} plan. Upgrade to Elite!`,
                code: 'VIDEO_NOT_ALLOWED'
            });
        }

        const image = await prisma.portfolioImage.create({
            data: {
                stylistId: stylist.id,
                imageUrl
            }
        });

        res.status(201).json(image);
    } catch (error) {
        console.error('addPortfolioImage Error:', error);
        res.status(500).json({ error: 'Failed to add image', details: error.message });
    }
};

const getPortfolioImages = async (req, res) => {
    const { stylistId } = req.params;
    try {
        const images = await prisma.portfolioImage.findMany({
            where: { stylistId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
};

const deletePortfolioImage = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const image = await prisma.portfolioImage.findUnique({
            where: { id },
            include: { stylist: true }
        });

        if (!image) return res.status(404).json({ error: 'Image not found' });
        if (image.stylist.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

        await prisma.portfolioImage.delete({ where: { id } });
        res.json({ message: 'Image removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete image' });
    }
};

module.exports = { addPortfolioImage, getPortfolioImages, deletePortfolioImage };
