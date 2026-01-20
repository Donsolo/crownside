const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Block User
exports.blockUser = async (req, res) => {
    try {
        const blockerId = req.user.id;
        const { targetUserId } = req.body;

        if (blockerId === targetUserId) return res.status(400).json({ error: "Cannot block yourself" });

        // 1. Create Block
        await prisma.block.create({
            data: {
                blockerId,
                blockedId: targetUserId
            }
        });

        // 2. Remove any connection
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { requesterId: blockerId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: blockerId }
                ]
            }
        });

        if (connection) {
            await prisma.connection.delete({ where: { id: connection.id } });
        }

        res.json({ message: "User blocked" });
    } catch (err) {
        // Unique constraint violation means already blocked
        if (err.code === 'P2002') return res.json({ message: "User already blocked" });
        console.error(err);
        res.status(500).json({ error: "Failed to block user" });
    }
};

// Unblock User
exports.unblockUser = async (req, res) => {
    try {
        const blockerId = req.user.id;
        const { targetUserId } = req.body;

        const block = await prisma.block.findFirst({
            where: { blockerId, blockedId: targetUserId }
        });

        if (block) {
            await prisma.block.delete({ where: { id: block.id } });
        }

        res.json({ message: "User unblocked" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to unblock user" });
    }
};
