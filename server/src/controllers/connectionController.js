const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Send a connection request
exports.sendRequest = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { targetUserId } = req.body;

        if (requesterId === targetUserId) {
            return res.status(400).json({ error: "Cannot connect with yourself" });
        }

        // Check if blocked
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: requesterId, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: requesterId }
                ]
            }
        });
        if (block) return res.status(403).json({ error: "Cannot connect with this user" });

        // Check existing connection
        const existing = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: requesterId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') return res.status(400).json({ error: "Already connected" });
            if (existing.status === 'PENDING') return res.status(400).json({ error: "Request already pending" });
        }

        // Create Request
        const connection = await prisma.connection.create({
            data: {
                requesterId,
                addresseeId: targetUserId,
                status: 'PENDING'
            }
        });

        // Notification
        await prisma.notification.create({
            data: {
                userId: targetUserId,
                senderId: requesterId,
                type: 'CONNECTION_REQUEST',
                isRead: false
            }
        });

        res.status(201).json(connection);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send request" });
    }
};

// Accept Request
exports.acceptRequest = async (req, res) => {
    try {
        const userId = req.user.id; // Addressee
        const { requesterId } = req.body;

        const connection = await prisma.connection.findFirst({
            where: {
                requesterId: requesterId,
                addresseeId: userId,
                status: 'PENDING'
            }
        });

        if (!connection) return res.status(404).json({ error: "Request not found" });

        const updated = await prisma.connection.update({
            where: { id: connection.id },
            data: { status: 'ACCEPTED' }
        });

        // 1. Mark Original Request Notification as Read
        await prisma.notification.updateMany({
            where: {
                userId: userId,
                senderId: requesterId,
                type: 'CONNECTION_REQUEST',
                isRead: false
            },
            data: { isRead: true }
        });

        // 2. Notification to Requester (Accepted)
        await prisma.notification.create({
            data: {
                userId: requesterId,
                senderId: userId,
                type: 'CONNECTION_ACCEPTED',
                isRead: false
            }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept request" });
    }
};

// Remove Connection (or Cancel Request)
exports.removeConnection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.body;

        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId }
                ]
            }
        });

        if (!connection) return res.status(404).json({ error: "Connection not found" });

        // CLEANUP: If Pending, remove the associated notification to clear badges
        if (connection.status === 'PENDING') {
            const isRequester = connection.requesterId === userId;
            // If I am requester, I am cancelling -> Delete notification I sent to target
            // If I am addressee, I am rejecting -> Delete notification sent to me by requester
            const notifTargetId = isRequester ? targetUserId : userId;
            const notifSenderId = isRequester ? userId : targetUserId;

            await prisma.notification.deleteMany({
                where: {
                    userId: notifTargetId,
                    senderId: notifSenderId,
                    type: 'CONNECTION_REQUEST'
                }
            });
        }

        await prisma.connection.delete({
            where: { id: connection.id }
        });

        res.json({ message: "Connection removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove connection" });
    }
};

// Get Connections
exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'PENDING' }
                ]
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                        profileImage: true, // [NEW] Catch Client Avatar
                        stylistProfile: {
                            select: { id: true, businessName: true, profileImage: true }
                        }
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                        profileImage: true, // [NEW] Catch Client Avatar
                        stylistProfile: {
                            select: { id: true, businessName: true, profileImage: true }
                        }
                    }
                }
            }
        });

        // Normalize output
        const friends = connections.map(c => {
            const isRequester = c.requesterId === userId;
            const friend = isRequester ? c.addressee : c.requester;

            // Explicitly resolve stylistId if role is STYLIST
            const stylistId = friend.role === 'STYLIST' ? friend.stylistProfile?.id : null;

            // Resolve Image: Stylist Profile > User Profile > null
            const validImage = friend.role === 'STYLIST'
                ? (friend.stylistProfile?.profileImage || friend.profileImage)
                : friend.profileImage;

            return {
                id: friend.id, // Keep generic userId
                stylistId: stylistId, // Explicit stylistId for routing
                connectionId: c.id,
                status: c.status,
                isIncoming: !isRequester && c.status === 'PENDING',
                name: (friend.role === 'STYLIST' && friend.stylistProfile?.businessName) ? friend.stylistProfile.businessName : friend.displayName,
                image: validImage, // Correctly resolved image
                role: friend.role
            };
        });

        res.json(friends);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch connections" });
    }
};

// Check Status
exports.checkStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.params;

        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId }
                ]
            }
        });

        if (!connection) return res.json({ status: 'NONE' });

        if (connection.status === 'ACCEPTED') return res.json({ status: 'CONNECTED' });

        if (connection.requesterId === userId) return res.json({ status: 'REQUEST_SENT' });

        return res.json({ status: 'REQUEST_RECEIVED' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to check status" });
    }
};
