const prisma = require('../prisma');

const addPortfolioImage = async (req, res) => {
    const userId = req.user.id;
    let { imageUrl } = req.body;

    // Handle File Upload
    if (req.file) {
        imageUrl = `${process.env.API_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    }

    if (!imageUrl) return res.status(400).json({ error: 'Image is required' });

    try {
        const stylist = await prisma.stylistProfile.findUnique({ where: { userId } });
        if (!stylist) return res.status(404).json({ error: 'Stylist profile not found' });

        const image = await prisma.portfolioImage.create({
            data: {
                stylistId: stylist.id,
                imageUrl
            }
        });

        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add image' });
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
