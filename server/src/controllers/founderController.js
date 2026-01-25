const prisma = require('../prisma');

const acceptFounderInvite = async (req, res) => {
    const userId = req.user.id; // From authMiddleware

    try {
        // 1. Transaction to Ensure Atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Re-fetch user to verify eligibility state
            const user = await tx.user.findUnique({ where: { id: userId } });

            if (!user.isFounderEligible) {
                throw new Error("User is not eligible for Founders Circle.");
            }
            if (user.isFounderEnrolled) {
                return { alreadyJoined: true }; // Business logic choice: just return success if already done?
            }

            // 2. Clear Notification
            // Find the invite notification
            await tx.notification.deleteMany({
                where: {
                    userId: userId,
                    type: 'FOUNDER_INVITE'
                }
            });

            // 3. Update User Status
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    isFounderEnrolled: true,
                    founderAcceptedAt: new Date()
                    // founderAssignedAt was set when eligibility was granted (register or admin invite)
                }
            });

            return { user: updatedUser };
        });

        if (result.alreadyJoined) {
            return res.status(200).json({ message: 'Already a Founder' });
        }

        res.status(200).json({ success: true, message: 'Welcome to the Founders Circle!', user: result.user });

    } catch (error) {
        console.error('Accept Founder Invite Error:', error);
        res.status(400).json({ error: error.message || 'Failed to accept invitation.' });
    }
};

// ADMIN OVERRIDE
const inviteUserToFounders = async (req, res) => {
    // Expect admin middleware to have run
    const { email } = req.body;
    const adminId = req.user.id;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isFounderEligible || user.isFounderEnrolled) {
            return res.status(400).json({ error: 'User is already a Founder or Invited.' });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Set Eligibility
            await tx.user.update({
                where: { id: user.id },
                data: {
                    isFounderEligible: true,
                    founderType: user.role, // Match their role
                    founderAssignedBy: 'ADMIN', // DOES NOT COUNT TOWARD QUOTA
                    founderAssignedAt: new Date()
                }
            });

            // 2. Send Invitation
            await tx.notification.create({
                data: {
                    userId: user.id,
                    senderId: adminId,
                    type: 'FOUNDER_INVITE'
                }
            });
        });

        res.json({ message: `Invitation sent to ${user.displayName || user.email}. This does not affect the system quota.` });

    } catch (error) {
        console.error('Admin Invite Error:', error);
        res.status(500).json({ error: 'Failed to invite user.' });
    }
}

// ADMIN REMOVE (For Testing/Management)
const removeUserFromFounders = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.isFounderEligible && !user.isFounderEnrolled) {
            return res.status(400).json({ error: 'User is not in the Founders program.' });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Remove Flags
            await tx.user.update({
                where: { id: user.id },
                data: {
                    isFounderEligible: false,
                    isFounderEnrolled: false,
                    founderType: null,
                    founderAssignedBy: null,
                    founderAssignedAt: null,
                    founderAcceptedAt: null
                }
            });

            // 2. Clear Any Pending Invites
            await tx.notification.deleteMany({
                where: {
                    userId: user.id,
                    type: 'FOUNDER_INVITE'
                }
            });
        });

        res.json({ message: `User ${user.displayName || user.email} removed from Founders Circle.` });

    } catch (error) {
        console.error('Admin Remove Error:', error);
        res.status(500).json({ error: 'Failed to remove user.' });
    }
}

module.exports = { acceptFounderInvite, inviteUserToFounders, removeUserFromFounders };
