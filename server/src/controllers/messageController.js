const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create or Get Conversation
const getOrCreateConversation = async (req, res) => {
    try {
        const { bookingId, participantId } = req.body;
        const userId = req.user.id; // From auth middleware

        // Scenario A: Booking-based Chat
        if (bookingId) {
            // ... (Existing Logic, slightly updated)
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { stylist: true, client: true }
            });

            if (!booking) return res.status(404).json({ error: 'Booking not found' });

            const isClient = booking.clientId === userId;
            const isStylist = booking.stylist.userId === userId;

            if (!isClient && !isStylist) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            let conversation = await prisma.conversation.findUnique({
                where: { bookingId },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });

            if (!conversation) {
                // Determine Generic Participants for consistency
                // P1: Client, P2: Stylist (User)
                conversation = await prisma.conversation.create({
                    data: {
                        bookingId,
                        clientId: booking.clientId,
                        stylistId: booking.stylistId,
                        participant1Id: booking.clientId,
                        participant2Id: booking.stylist.userId
                    }
                });
            }
            return res.json(conversation);
        }

        // Scenario B: Direct Message (Generic)
        if (participantId) {
            if (participantId === userId) return res.status(400).json({ error: "Cannot chat with yourself" });

            // 1. Check Blocks
            const block = await prisma.block.findFirst({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: participantId },
                        { blockerId: participantId, blockedId: userId }
                    ]
                }
            });
            if (block) return res.status(403).json({ error: "Cannot message this user" });

            // 2. Find Existing Generic Conversation
            // We need to check both [P1=Me, P2=Them] and [P1=Them, P2=Me]
            let conversation = await prisma.conversation.findFirst({
                where: {
                    OR: [
                        { participant1Id: userId, participant2Id: participantId },
                        { participant1Id: participantId, participant2Id: userId }
                    ]
                },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });

            // 3. Create if not exists
            if (!conversation) {
                // Ensure P1 < P2 for consistency to avoid duplicates? Or just create
                // We'll just set P1=UserId, P2=ParticipantId
                conversation = await prisma.conversation.create({
                    data: {
                        participant1Id: userId,
                        participant2Id: participantId
                    }
                });
            }
            return res.json(conversation);
        }

        return res.status(400).json({ error: 'Booking ID or Participant ID is required' });

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

        // 1. Fetch Conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                // Include generic participants
                participant1: { select: { id: true, displayName: true, role: true, stylistProfile: { select: { businessName: true, profileImage: true } } } },
                participant2: { select: { id: true, displayName: true, role: true, stylistProfile: { select: { businessName: true, profileImage: true } } } },
                // Fallback for legacy
                client: { select: { id: true, displayName: true } },
                stylist: { select: { id: true, businessName: true, userId: true } }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Security: Ensure participant
        // Check new generic connection OR legacy connection
        const isP1 = conversation.participant1Id === userId;
        const isP2 = conversation.participant2Id === userId;
        const isLegacyClient = conversation.clientId === userId;
        const isLegacyStylist = conversation.stylist?.userId === userId;

        if (!isP1 && !isP2 && !isLegacyClient && !isLegacyStylist) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 2. Fetch Messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

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

        // Permissions logic (legacy + generic)
        const isP1 = conversation.participant1Id === userId;
        const isP2 = conversation.participant2Id === userId;
        const isLegacyClient = conversation.clientId === userId;
        const isLegacyStylist = conversation.stylist?.userId === userId;

        if (!isP1 && !isP2 && !isLegacyClient && !isLegacyStylist) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 2. CHECK BLOCKS
        // Determine the "Other" user ID
        let recipientId = null;
        if (conversation.participant1Id && conversation.participant2Id) {
            recipientId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;
        } else if (conversation.clientId && conversation.stylist) {
            recipientId = conversation.clientId === userId ? conversation.stylist.userId : conversation.clientId;
        }

        if (recipientId) {
            const block = await prisma.block.findFirst({
                where: {
                    OR: [
                        { blockerId: userId, blockedId: recipientId },
                        { blockerId: recipientId, blockedId: userId }
                    ]
                }
            });
            if (block) return res.status(403).json({ error: "Cannot message this user (Blocked)" });
        }

        // 3. Create Message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content: content.trim()
            }
        });

        // 4. Update Last Message At
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() }
        });

        // 5. NOTIFICATION
        if (recipientId) {
            const existingNotif = await prisma.notification.findFirst({
                where: {
                    userId: recipientId,
                    type: 'NEW_MESSAGE',
                    conversationId: conversationId,
                    isRead: false
                }
            });

            if (existingNotif) {
                await prisma.notification.update({
                    where: { id: existingNotif.id },
                    data: { createdAt: new Date() }
                });
            } else {
                await prisma.notification.create({
                    data: {
                        userId: recipientId,
                        senderId: userId,
                        type: 'NEW_MESSAGE',
                        conversationId: conversationId
                    }
                });
            }
        }

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

        // 1. Mark all messages NOT sent by me as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                readAt: null
            },
            data: { readAt: new Date() }
        });

        // 2. Mark the Notification as Read
        await prisma.notification.updateMany({
            where: {
                userId,
                type: 'NEW_MESSAGE',
                conversationId,
                isRead: false
            },
            data: { isRead: true }
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

        // Find conversations user is part of (Generic OR Legacy)
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId },
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
