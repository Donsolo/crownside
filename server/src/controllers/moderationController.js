const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Report Queue
const getReportQueue = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { status: 'PENDING' },
            include: {
                reporter: { select: { id: true, displayName: true, email: true } },
                forumPost: { select: { id: true, title: true, content: true, board: true } },
                comment: { include: { author: { select: { displayName: true } } } },
                targetUser: { select: { id: true, displayName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        console.error("Get Reports Error:", error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// Perform Moderation Action
const performAction = async (req, res) => {
    const { action, targetType, targetId, duration } = req.body;
    const moderatorId = req.user.id;

    // Actions: DISMISS, RESOLVE, REMOVE, LOCK, MUTE

    try {
        if (action === 'DISMISS') {
            await prisma.report.updateMany({
                where: {
                    OR: [
                        { forumPostId: targetId },
                        { commentId: targetId },
                        { targetUserId: targetId }
                    ],
                    status: 'PENDING'
                },
                data: { status: 'DISMISSED', notes: `Dismissed by ${moderatorId}` }
            });
            return res.json({ message: 'Reports dismissed' });
        }

        if (action === 'RESOLVE' && targetType === 'POST') {
            // For Help/Feedback threads
            await prisma.forumPost.update({
                where: { id: targetId },
                data: { status: 'RESOLVED', moderatedBy: moderatorId, moderatedAt: new Date() }
            });
            return res.json({ message: 'Post resolved' });
        }

        if (action === 'LOCK' && targetType === 'POST') {
            await prisma.forumPost.update({
                where: { id: targetId },
                data: { isLocked: true, moderatedBy: moderatorId, moderatedAt: new Date() }
            });
            return res.json({ message: 'Post locked' });
        }

        if (action === 'UNLOCK' && targetType === 'POST') {
            await prisma.forumPost.update({
                where: { id: targetId },
                data: { isLocked: false, moderatedBy: moderatorId, moderatedAt: new Date() }
            });
            return res.json({ message: 'Post unlocked' });
        }

        if (action === 'REMOVE') {
            if (targetType === 'POST') {
                await prisma.forumPost.update({
                    where: { id: targetId },
                    data: { status: 'REMOVED', moderatedBy: moderatorId, moderationReason: 'Removed by Moderator', moderatedAt: new Date() }
                });
            } else if (targetType === 'COMMENT') {
                await prisma.comment.update({
                    where: { id: targetId },
                    data: { isRemoved: true, removedBy: moderatorId, removedReason: 'Removed by Moderator', removedAt: new Date() }
                });
            }
            // Auto-resolve reports
            await prisma.report.updateMany({
                where: {
                    OR: [
                        { forumPostId: targetId },
                        { commentId: targetId }
                    ],
                    status: 'PENDING'
                },
                data: { status: 'RESOLVED', notes: `Content removed by ${moderatorId}` }
            });

            return res.json({ message: 'Content removed' });
        }

        if (action === 'MUTE' && targetType === 'USER') {
            if (!duration) return res.status(400).json({ error: 'Duration required for mute' });

            const muteUntil = new Date();
            muteUntil.setHours(muteUntil.getHours() + parseInt(duration)); // Duration in hours

            await prisma.user.update({
                where: { id: targetId },
                data: { mutedUntil: muteUntil }
            });

            return res.json({ message: `User muted for ${duration} hours` });
        }

        res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error("Moderation Action Error:", error);
        res.status(500).json({ error: 'Action failed' });
    }
};

module.exports = {
    getReportQueue,
    performAction
};
