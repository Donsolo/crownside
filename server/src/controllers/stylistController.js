const prisma = require('../prisma');

const listStylists = async (req, res) => {
    try {
        const stylists = await prisma.stylistProfile.findMany({
            include: {
                services: true,
                user: { select: { email: true } }
            }
        });
        res.json(stylists);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stylists' });
    }
};

const getStylistById = async (req, res) => {
    const { id } = req.params;
    try {
        const stylist = await prisma.stylistProfile.findUnique({
            where: { id },
            include: {
                services: true,
                portfolioImages: true,
                stylistBookings: {
                    include: { reviews: true }
                }
            }
        });

        if (!stylist) return res.status(404).json({ error: 'Stylist not found' });

        res.json(stylist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stylist' });
    }
};

const updateProfile = async (req, res) => {
    const userId = req.user.id; // From token
    try {
        // Update logic assuming the profile exists (created at register)
        const updatedProfile = await prisma.stylistProfile.update({
            where: { userId },
            data: req.body
        });
        res.json(updatedProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const { getFileUrl } = require('../utils/fileUrl');

const uploadProfileImage = async (req, res) => {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    try {
        const imageUrl = getFileUrl(req, req.file);

        const updated = await prisma.stylistProfile.update({
            where: { userId },
            data: { profileImage: imageUrl }
        });

        res.json({ imageUrl, profile: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload profile image' });
    }
};

const uploadBannerImage = async (req, res) => {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    try {
        const imageUrl = getFileUrl(req, req.file);

        const updated = await prisma.stylistProfile.update({
            where: { userId },
            data: { bannerImage: imageUrl }
        });

        res.json({ imageUrl, profile: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload banner image' });
    }
};

module.exports = { listStylists, getStylistById, updateProfile, uploadProfileImage, uploadBannerImage };
