const prisma = require('../prisma');

const getNotifications = async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const includeRead = req.query.includeRead === 'true';

    try {
        const where = { userId };
        if (!includeRead) {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        displayName: true,
                        stylistProfile: {
                            select: { profileImage: true }
                        }
                    }
                },
                booking: { select: { id: true, status: true, appointmentDate: true, stylist: { select: { businessName: true } } } },
                post: { select: { id: true, title: true } },
                comment: { select: { id: true, content: true } },
                conversation: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        // Also fetch unread count for the badge
        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const getUnreadCount = async (req, res) => {
    const userId = req.user.id;
    try {
        const unread = await prisma.notification.findMany({
            where: { userId, isRead: false },
            select: { type: true }
        });

        const counts = {
            total: unread.length,
            bookings: unread.filter(n => n.type === 'NEW_BOOKING' || n.type === 'BOOKING_UPDATE').length,
            messages: unread.filter(n => n.type === 'NEW_MESSAGE').length,
            forum: unread.filter(n => ['NEW_COMMENT', 'REPLY', 'MENTION', 'LIKE_POST', 'LIKE_COMMENT'].includes(n.type)).length,
            connections: unread.filter(n => n.type === 'CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED').length,
            system: unread.filter(n => n.type === 'FOUNDER_INVITE').length
        };

        res.json({ counts });
    } catch (error) {
        console.error("Count Error", error);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return res.status(404).json({ error: 'Not found' });
        if (notification.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

const markAllAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
