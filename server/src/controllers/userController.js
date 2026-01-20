const prisma = require('../prisma');

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                stylistProfile: {
                    select: {
                        businessName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};


const getDashboardStats = async (req, res) => {
    try {
        const [userCount, stylistCount, bookingCount, reviewCount] = await Promise.all([
            prisma.user.count({ where: { role: 'CLIENT' } }),
            prisma.user.count({ where: { role: 'STYLIST' } }),
            prisma.booking.count(),
            prisma.review.count()
        ]);

        res.json({
            users: userCount,
            pros: stylistCount,
            bookings: bookingCount,
            reviews: reviewCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.user?.id;

        // 1. Check Blocks
        if (requesterId) {
            const block = await prisma.block.findFirst({
                where: {
                    OR: [
                        { blockerId: requesterId, blockedId: userId },
                        { blockerId: userId, blockedId: requesterId }
                    ]
                }
            });
            if (block) return res.status(404).json({ error: 'User not found' }); // Hide logic
        }

        // 2. Fetch User
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                stylistProfile: true, // If they have one
                _count: {
                    select: { sentConnections: { where: { status: 'ACCEPTED' } }, receivedConnections: { where: { status: 'ACCEPTED' } } }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // 3. Transform Connection Count
        const connectionCount = (user._count.sentConnections || 0) + (user._count.receivedConnections || 0);

        // 4. Return Public Data based on Role
        if (user.role === 'STYLIST' && user.stylistProfile) {
            // Stylist public profile (reuse logic or return object)
            // Ideally should return similar structure to stylistController, but maybe lighter?
            // Actually StylistProfile page uses /stylists/:id (which is by StylistProfile ID usually? Or userId?)
            // stylistController.getStylist uses StylistProfile.id or userId?
            // Let's assume we return basic user info for connections.
            // If it's a "Storefront" visit, client uses /stylists/:id.
            // If it's a "Social" visit, maybe we need this?
            // The prompt says "Stylist: Open Stylist Public Storefront Profile".
            // So client will likely redirect to /stylist/:stylistProfileId if they are a stylist.
            // THIS endpoint is for "Client Public Profile".
            // But if we hit this with a Stylist ID, we should probably return it too.
            // Let's return the User Object cleaned up.
        }

        // Check Relationship
        let connectionStatus = 'NONE';
        if (requesterId) {
            const connection = await prisma.connection.findFirst({
                where: {
                    OR: [
                        { requesterId, addresseeId: userId },
                        { requesterId: userId, addresseeId: requesterId }
                    ]
                }
            });
            if (connection) {
                if (connection.status === 'ACCEPTED') connectionStatus = 'CONNECTED';
                else if (connection.requesterId === requesterId) connectionStatus = 'REQUEST_SENT';
                else connectionStatus = 'REQUEST_RECEIVED';
            }
        }

        const publicProfile = {
            id: user.id,
            displayName: user.displayName,
            role: user.role,
            bio: user.bio,
            location: user.location,
            createdAt: user.createdAt,
            profileImage: user.stylistProfile?.profileImage, // Use stylist image if exists as fallback or avatar
            stylistProfileId: user.stylistProfile?.id,
            connectionCount,
            connectionStatus
        };

        res.json(publicProfile);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch public profile' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['CLIENT', 'STYLIST', 'ADMIN', 'MODERATOR'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, email: true, role: true }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

module.exports = { getAllUsers, getDashboardStats, getPublicProfile, updateUserRole };

