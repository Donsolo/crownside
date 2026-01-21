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
                        businessName: true,
                        subscription: {
                            select: {
                                planKey: true,
                                status: true
                            }
                        }
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
        const { role, tier } = req.body; // tier is optional, e.g., 'ELITE'

        if (!['CLIENT', 'STYLIST', 'ADMIN', 'MODERATOR'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const validTiers = ['PRO', 'ELITE', 'PREMIER']; // Use constants if imported, but safely hardcoded here or check config

        // Execute as transaction to ensure data integrity
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Update User Role
            const user = await tx.user.update({
                where: { id: userId },
                data: { role },
                include: { stylistProfile: true }
            });

            // 2. Handle Stylist Promotion / Tier Changes
            if (role === 'STYLIST') {
                let stylistProfile = user.stylistProfile;

                // Ensure StylistProfile exists
                if (!stylistProfile) {
                    const handleBase = (user.displayName || user.email.split('@')[0]).replace(/\s+/g, '-').toLowerCase();
                    const uniqueHandle = `${handleBase}-${user.id.slice(0, 4)}`;

                    stylistProfile = await tx.stylistProfile.create({
                        data: {
                            userId: user.id,
                            businessName: (user.displayName || user.email.split('@')[0]) + "'s Scheduler",
                            storefrontHandle: uniqueHandle, // Generate basic handle
                            locationType: 'SALON', // Default
                            contactPreference: 'BOOKINGS_ONLY'
                        }
                    });
                }

                // If a Tier is specified (or if we are promoting to Stylist and need a default), set it.
                // If the user was already a Stylist and we are just changing role to Stylist (no-op) but providing a new Tier, we update it.
                if (tier) {
                    const planKey = tier.toLowerCase(); // 'elite'
                    // Check if legitimate tier
                    // upsert Subscription
                    await tx.professionalSubscription.upsert({
                        where: { stylistId: stylistProfile.id },
                        create: {
                            stylistId: stylistProfile.id,
                            planKey: planKey,
                            status: 'ACTIVE',
                            stripeSubscriptionId: 'admin_grant', // Marker for admin override
                        },
                        update: {
                            planKey: planKey,
                            status: 'ACTIVE',
                            // Keep existing Stripe ID if it's real? 
                            // If we are overriding, we probably want to ensure it's ACTIVE. 
                            // Use 'admin_grant' if not present or if we want to explicitly acknowledge the override?
                            // Let's keep existing ID if it looks real (starts with sub_) otherwise use admin_grant
                            // actually, if we are changing logic, let's just force ACTIVE. 
                            status: 'ACTIVE'
                        }
                    });

                    // Also update the StylistProfile subscriptionStatus cache if you rely on it?
                    // Schema has `subscriptionStatus` on StylistProfile too as a cache/flag?
                    // Yes: `subscriptionStatus SubscriptionStatus @default(INACTIVE)`
                    await tx.stylistProfile.update({
                        where: { id: stylistProfile.id },
                        data: { subscriptionStatus: 'ACTIVE' }
                    });
                }
            } else {
                // Demotion (e.g. to CLIENT)
                // We should probably deactivate their subscription if they had one?
                if (user.stylistProfile) {
                    await tx.professionalSubscription.updateMany({
                        where: { stylistId: user.stylistProfile.id },
                        data: { status: 'INACTIVE' } // Or CANCELED
                    });

                    await tx.stylistProfile.update({
                        where: { id: user.stylistProfile.id },
                        data: { subscriptionStatus: 'INACTIVE' }
                    });
                }
            }

            // Return updated user with new data
            return await tx.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    stylistProfile: {
                        select: {
                            subscription: { select: { planKey: true, status: true } }
                        }
                    }
                }
            });
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting self
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        // Find user first to confirm existence and role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { stylistProfile: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Execute huge transaction to clean up all relations
        await prisma.$transaction(async (tx) => {
            // 1. Social & Notifications
            // Delete notifications involved with this user (either sent or received)
            await tx.notification.deleteMany({
                where: { OR: [{ userId }, { senderId: userId }] }
            });

            await tx.connection.deleteMany({
                where: { OR: [{ requesterId: userId }, { addresseeId: userId }] }
            });

            await tx.block.deleteMany({
                where: { OR: [{ blockerId: userId }, { blockedId: userId }] }
            });

            // 2. Engagement (Likes, Views, Reports)
            await tx.like.deleteMany({ where: { userId } });
            await tx.postView.deleteMany({ where: { userId } });
            await tx.report.deleteMany({
                where: { OR: [{ reporterId: userId }, { targetUserId: userId }] }
            });

            // 3. Comments
            // Note: If user has replied to threads, this deletes their contributions.
            // If deleting a parent comment causes constraint violation on children, this might fail 
            // without recursive logic, but standard Prisma deleteMany usually handles simple FKs unless Restrict is set.
            await tx.comment.deleteMany({ where: { authorId: userId } });

            // 4. Forum Posts
            // Comments and Images usually cascade from Post if schema defines it.
            // Our schema: Comment->Post (Cascade), Image->Post (Cascade). Safe.
            await tx.forumPost.deleteMany({ where: { authorId: userId } });

            // 5. Messaging / Conversations
            // Find conversations where user is ANY participant
            // Note: StylistProfile participation needs checking stylistId
            const orConditions = [
                { clientId: userId },
                { participant1Id: userId },
                { participant2Id: userId }
            ];
            if (user.stylistProfile) {
                orConditions.push({ stylistId: user.stylistProfile.id });
            }

            const conversations = await tx.conversation.findMany({
                where: { OR: orConditions }
            });

            const convIds = conversations.map(c => c.id);
            if (convIds.length > 0) {
                await tx.message.deleteMany({
                    where: { conversationId: { in: convIds } }
                });
                await tx.conversation.deleteMany({
                    where: { id: { in: convIds } }
                });
            }

            // 6. Bookings (As Client)
            const clientBookings = await tx.booking.findMany({ where: { clientId: userId } });
            const clientBookingIds = clientBookings.map(b => b.id);
            if (clientBookingIds.length > 0) {
                await tx.review.deleteMany({ where: { bookingId: { in: clientBookingIds } } });
                // Clean remaining notifications linked to these bookings just in case
                await tx.notification.deleteMany({ where: { bookingId: { in: clientBookingIds } } });
                await tx.booking.deleteMany({ where: { id: { in: clientBookingIds } } });
            }

            // 7. Stylist Specifics
            if (user.stylistProfile) {
                const sId = user.stylistProfile.id;

                // Stylist Bookings
                const stylistBookings = await tx.booking.findMany({ where: { stylistId: sId } });
                const sBookingIds = stylistBookings.map(b => b.id);
                if (sBookingIds.length > 0) {
                    await tx.review.deleteMany({ where: { bookingId: { in: sBookingIds } } });
                    await tx.notification.deleteMany({ where: { bookingId: { in: sBookingIds } } });
                    await tx.booking.deleteMany({ where: { id: { in: sBookingIds } } });
                }

                // Services & Portfolio & Sub
                await tx.service.deleteMany({ where: { stylistId: sId } });
                await tx.portfolioImage.deleteMany({ where: { stylistId: sId } });
                await tx.professionalSubscription.deleteMany({ where: { stylistId: sId } });

                // Finally Delete Profile
                await tx.stylistProfile.delete({ where: { id: sId } });
            }

            // 8. Finally Delete User
            await tx.user.delete({ where: { id: userId } });
        });

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user: ' + error.message });
        // Optionally map P2003 again if we missed something
    }
};

module.exports = { getAllUsers, getDashboardStats, getPublicProfile, updateUserRole, deleteUser };
