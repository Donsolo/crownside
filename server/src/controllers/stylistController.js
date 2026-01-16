const prisma = require('../prisma');

const listStylists = async (req, res) => {
    try {
        const stylists = await prisma.stylistProfile.findMany({
            include: {
                services: true,
                user: { select: { email: true } }
            }
            // Contact info is included by default in Prisma unless explicitly selected.
            // Goal: Do NOT include in list/search.
            // Since we are using detailed 'include', we can't easily use 'select' to exclude just a few without listing ALL fields.
            // Strategy: Map the result to strip sensitive fields.
        });

        const sanitized = stylists.map(s => {
            const { phoneNumber, instagramHandle, tiktokHandle, websiteUrl, contactPreference, ...publicData } = s;
            return publicData;
        });

        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stylists' });
    }
};

const adminListStylists = async (req, res) => {
    try {
        const stylists = await prisma.stylistProfile.findMany({
            include: {
                services: true,
                user: { select: { email: true } },
                subscription: true,
                portfolioImages: true
            }
        });
        res.json(stylists); // Return raw data including contact info
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stylists for admin' });
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
        const { phoneNumber, instagramHandle, tiktokHandle, websiteUrl, contactPreference, ...otherData } = req.body;

        // Data Validation / Sanitization
        let cleanData = { ...otherData };

        if (contactPreference) {
            const validPrefs = ['BOOKINGS_ONLY', 'CALL_OR_TEXT', 'SOCIAL_DM'];
            if (validPrefs.includes(contactPreference)) {
                cleanData.contactPreference = contactPreference;
            }
        }

        if (phoneNumber !== undefined) cleanData.phoneNumber = phoneNumber; // Allow clearing string
        if (websiteUrl !== undefined) cleanData.websiteUrl = websiteUrl;

        // Strip @ from handles if present
        if (instagramHandle !== undefined) {
            cleanData.instagramHandle = instagramHandle ? instagramHandle.replace('@', '').trim() : null;
        }
        if (tiktokHandle !== undefined) {
            cleanData.tiktokHandle = tiktokHandle ? tiktokHandle.replace('@', '').trim() : null;
        }

        const updatedProfile = await prisma.stylistProfile.update({
            where: { userId },
            data: cleanData
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

module.exports = { listStylists, getStylistById, updateProfile, uploadProfileImage, uploadBannerImage, adminListStylists };
