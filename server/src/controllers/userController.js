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

module.exports = { getAllUsers, getDashboardStats };

