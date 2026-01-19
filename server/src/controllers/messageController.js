const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create or Get Conversation
const getOrCreateConversation = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!bookingId) return res.status(400).json({ error: 'Booking ID is required' });

        // 1. Verify User is part of Booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { stylist: true, client: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Security Check: Must be Client or Stylist (userId check)
        // Adjust logic: stylist.userId (stylist profile owner) vs client.id
        const isClient = booking.clientId === userId;
        const isStylist = booking.stylist.userId === userId;

        if (!isClient && !isStylist) {
            console.error(`Unauthorized Chat Access: User ${userId} is not Client (${booking.clientId}) or Stylist Owner (${booking.stylist.userId}) for Booking ${booking.id}`);
            return res.status(403).json({ error: 'You are not a participant of this booking.' });
        }

        // 2. Check if Conversation exists
        let conversation = await prisma.conversation.findUnique({
            where: { bookingId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Just get last message preview
                }
            }
        });

        // 3. Create if not exists
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    bookingId,
                    clientId: booking.clientId,
                    stylistId: booking.stylistId,
                }
            });
        }

        res.json(conversation);

    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};

// Get Conversation Details & Messages
const getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 50;

        // 1. Fetch Conversation with Pagination
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                client: { select: { id: true, displayName: true } },
                stylist: { select: { id: true, businessName: true, userId: true } }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Security: Ensure participant
        const isParticipant = conversation.clientId === userId || conversation.stylist.userId === userId;
        if (!isParticipant) return res.status(403).json({ error: 'Unauthorized' });

        // 2. Fetch Messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' }, // Newest first for pagination
            skip: (page - 1) * limit,
            take: limit
        });

        // Reverse to show chronological Order (Oldest -> Newest) for UI
        res.json({
            conversation,
            messages: messages.reverse(),
            hasMore: messages.length === limit
        });

    } catch (error) {
        console.error('Error in getConversation:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// Send Message
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

        // 1. Verify Conversation & Participation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { stylist: true }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const isParticipant = conversation.clientId === userId || conversation.stylist.userId === userId;
        if (!isParticipant) return res.status(403).json({ error: 'Unauthorized' });

        // 2. Create Message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content: content.trim()
            }
        });

        // 3. Update Last Message At
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        res.json(message);

    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Mark as Read
const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Mark all messages NOT sent by me as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                readAt: null
            },
            data: { readAt: new Date() }
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Get Unread Count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Count messages where:
        // 1. I am part of the conversation (Client OR Stylist)
        // 2. Sender is NOT me
        // 3. readAt is null

        // Since we don't have a direct "Participant" table, we query messages in conversations we belong to
        // Ideally complex query, but strict relations help.

        // Find conversation IDs where user is participant
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { clientId: userId },
                    { stylist: { userId: userId } }
                ]
            },
            select: { id: true }
        });

        const conversationIds = conversations.map(c => c.id);

        if (conversationIds.length === 0) return res.json({ count: 0 });

        const count = await prisma.message.count({
            where: {
                conversationId: { in: conversationIds },
                senderId: { not: userId },
                readAt: null
            }
        });

        res.json({ count });

    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};

module.exports = {
    getOrCreateConversation,
    getConversation,
    sendMessage,
    markAsRead,
    getUnreadCount
};
