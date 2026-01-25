const prisma = require('../prisma');

const listStylists = async (req, res) => {
    try {
        const stylists = await prisma.stylistProfile.findMany({
            include: {
                services: true,
                user: { select: { email: true, isFounderEnrolled: true } }
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
        let whereClause = {};

        // basic UUID check regex
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUuid) {
            whereClause = { id };
        } else {
            // Treat as handle (support handle@thecrownside.com input too)
            const cleanHandle = id.split('@')[0].toLowerCase();
            whereClause = { storefrontHandle: cleanHandle };
        }

        const stylist = await prisma.stylistProfile.findFirst({
            where: whereClause,
            include: {
                user: { select: { isFounderEnrolled: true } },
                services: true,
                portfolioImages: true,
                subscription: { select: { planKey: true } },
                stylistBookings: {
                    include: { reviews: true }
                }
            }
        });

        if (!stylist) return res.status(404).json({ error: 'Stylist not found' });

        res.json(stylist);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stylist' });
    }
};

const generateHandle = async (name, currentUserId) => {
    if (!name) return null;

    // 1. Sanitize: lowercase, alphanumeric only
    let baseHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseHandle) baseHandle = "stylist"; // fallback

    let handle = baseHandle;
    let counter = 1;

    // 2. Loop until unique
    while (true) {
        const existing = await prisma.stylistProfile.findUnique({
            where: { storefrontHandle: handle }
        });

        // If it's unique OR it belongs to self, we're good
        if (!existing || (currentUserId && existing.userId === currentUserId)) {
            return handle;
        }

        // Collision -> append number
        counter++;
        handle = `${baseHandle}${counter}`;
    }
};

const updateProfile = async (req, res) => {
    const userId = req.user.id; // From token
    try {
        const {
            businessName, bio, locationType,
            phoneNumber, instagramHandle, tiktokHandle, websiteUrl, contactPreference,
            specialties, profileImage, bannerImage
        } = req.body;

        // Whitelist approach to avoid passing relations (services, user, etc.) to Prisma
        let cleanData = {};

        if (bio !== undefined) cleanData.bio = bio;
        if (locationType !== undefined) cleanData.locationType = locationType;
        if (specialties !== undefined) cleanData.specialties = specialties;
        if (profileImage !== undefined) cleanData.profileImage = profileImage;
        if (bannerImage !== undefined) cleanData.bannerImage = bannerImage;

        // Handle Business Name & Storefront Handle
        if (businessName) {
            cleanData.businessName = businessName;
            // Generate/Update handle if name changed
            // Ideally we check if it changed (optimization), but generator handles ownership check efficiently.
            cleanData.storefrontHandle = await generateHandle(businessName, userId);
        }

        // Contact Info Logic
        if (contactPreference) {
            const validPrefs = ['BOOKINGS_ONLY', 'CALL_OR_TEXT', 'SOCIAL_DM'];
            if (validPrefs.includes(contactPreference)) {
                cleanData.contactPreference = contactPreference;
            }
        }
        if (phoneNumber !== undefined) cleanData.phoneNumber = phoneNumber;
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
        console.error("Update Profile Error:", error);
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
