const prisma = require('../prisma');
const { checkSlotAvailability } = require('./availabilityController'); // Import Check

const createBooking = async (req, res) => {
    let clientId = req.user.id; // Default to acting user (Client booking for self)
    const { stylistId, serviceId, appointmentDate, notes, stylistClientId, durationOverride, force } = req.body;
    console.log(`Creating booking: User ${req.user.id} Role: ${req.user.role}`);

    try {
        // Validate Stylist and Service
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return res.status(404).json({ error: 'Service not found' });

        const duration = durationOverride || service.duration;

        // --- AVAILABILITY CHECK ---
        // Verify slot is open (unless forced by Stylist)
        // Stylists can pass force: true to override blocking, but we should default to checking
        const shouldCheck = !(req.user.role === 'STYLIST' && force === true);

        if (shouldCheck) {
            const availability = await checkSlotAvailability(stylistId, appointmentDate, duration);
            if (!availability.available) {
                return res.status(409).json({
                    error: 'Slot unavailable',
                    reason: availability.reason
                });
            }
        }

        let status = 'PENDING';
        let bookingData = {
            stylistId,
            serviceId,
            appointmentDate: new Date(appointmentDate),
            duration,
            notes
        };

        // Override logic for Stylists (Manual Booking)
        if (req.user.role === 'STYLIST') {
            // Verify the stylist is booking for themselves
            const profile = await prisma.stylistProfile.findUnique({ where: { userId: req.user.id } });
            if (!profile || profile.id !== stylistId) {
                return res.status(403).json({ error: 'You can only create manual bookings for your own schedule.' });
            }

            status = 'APPROVED';

            // Handle Manual Client Association
            if (stylistClientId) {
                const sc = await prisma.stylistClient.findUnique({ where: { id: stylistClientId } });
                if (sc) {
                    bookingData.stylistClientId = sc.id;
                    // If this Rolodex client is linked to a CrownSide User, associate them
                    if (sc.userId) {
                        bookingData.clientId = sc.userId;
                    } else {
                        // Rolodex-only client, no User account associated
                        // bookingData.clientId remains undefined
                    }
                } else {
                    return res.status(404).json({ error: 'Selected client not found in rolodex' });
                }
            } else {
                // Fallback or explicit "Walk-in" handling if no client selected?
                // For now, require a client (they can create a "Walk-in" client in rolodex)
                return res.status(400).json({ error: 'Client is required for manual bookings' });
            }
        } else {
            // Standard Client Self-Booking
            bookingData.clientId = clientId;
        }

        bookingData.status = status;

        // Create Booking
        const booking = await prisma.booking.create({
            data: bookingData
        });

        // NOTIFICATION logic
        // If Client created it -> Notify Stylist (Already handled below)
        // If Stylist created it -> Notify Client (if they have a User account)

        if (req.user.role === 'CLIENT') {
            // ... existing notification to Stylist ...
            const stylistProfile = await prisma.stylistProfile.findUnique({
                where: { id: stylistId },
                select: { userId: true }
            });

            if (stylistProfile) {
                await prisma.notification.create({
                    data: {
                        userId: stylistProfile.userId,
                        senderId: clientId,
                        type: 'NEW_BOOKING',
                        bookingId: booking.id
                    }
                });
            }
        } else if (req.user.role === 'STYLIST' && booking.clientId) {
            // Notify the Client if they have a real account
            await prisma.notification.create({
                data: {
                    userId: booking.clientId,
                    senderId: req.user.id,
                    type: 'BOOKING_APPROVED', // Or NEW_BOOKING?
                    bookingId: booking.id
                }
            });
        }

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
};

const getMyBookings = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const asClient = req.query.asClient === 'true';

    try {
        let whereClause = {};

        // If explicitly asking as client, OR if user is only a CLIENT
        if (asClient || role === 'CLIENT') {
            whereClause = { clientId: userId };
        } else if (role === 'STYLIST') {
            // Default behavior for Stylist: Show bookings they need to fulfill
            const profile = await prisma.stylistProfile.findUnique({ where: { userId } });
            if (!profile) return res.json([]); // No profile yet
            whereClause = { stylistId: profile.id };
        } else if (role === 'ADMIN') {
            // Admin shouldn't really use this endpoint for all bookings, but fallback
            whereClause = {};
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                service: true,
                stylist: { select: { businessName: true, userId: true } },
                client: { select: { email: true, displayName: true } },
                conversation: {
                    select: {
                        id: true,
                        // Count unread messages for the current user (where receiver is me => sender is NOT me)
                        _count: {
                            select: {
                                messages: {
                                    where: {
                                        readAt: null,
                                        senderId: { not: userId }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { appointmentDate: 'asc' }
        });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, CANCELED, COMPLETED
    const userId = req.user.id;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { stylist: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Only the stylist can approve/complete. Client can cancel.
        // Simplification: Only stylist can change status for now, or match ID.
        // Real app needs granular permissions.

        if (booking.stylist.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await prisma.booking.update({
            where: { id },
            data: { status }
        });

        // NOTIFICATION: Trigger BOOKING_UPDATE for Client
        // Only if status actually changed (assumed yes by flow)
        await prisma.notification.create({
            data: {
                userId: booking.clientId, // Recipient (Client)
                senderId: userId,         // Triggered by Stylist
                type: 'BOOKING_UPDATE',
                bookingId: booking.id
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
};

const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { stylist: true, client: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Authorization: Only Client or Stylist can cancel
        if (booking.clientId !== userId && booking.stylist.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        // Prevent cancelling completed bookings
        if (booking.status === 'COMPLETED' || booking.status === 'CANCELED' || booking.status === 'CANCELLED_BY_CLIENT' || booking.status === 'CANCELLED_BY_TECH') {
            return res.status(400).json({ error: 'Cannot cancel an already completed or cancelled booking' });
        }

        const newStatus = role === 'CLIENT' ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_TECH';

        // 1. Update Booking
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                status: newStatus,
                cancellationReason: reason,
                cancelledAt: new Date(),
                cancelledBy: userId
            }
        });

        // 2. Insert System Message into Conversation (if exists or create one)
        // We need the conversation ID.
        let conversation = await prisma.conversation.findUnique({
            where: { bookingId: id }
        });

        if (!conversation) {
            // Create conversation if it doesn't exist to log the cancellation
            conversation = await prisma.conversation.create({
                data: {
                    bookingId: id,
                    clientId: booking.clientId,
                    stylistId: booking.stylistId,
                    lastMessageAt: new Date()
                }
            });
        }

        const systemMessageText = `Appointment cancelled by ${role === 'CLIENT' ? 'Client' : 'Beauty Tech'}. Reason: ${reason || 'No reason provided.'}`;

        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId, // Attributed to the canceler, or could be a system bot if we had one. Using canceler is fine.
                content: `[SYSTEM]: ${systemMessageText}`,
                readAt: null // Will trigger notification for the other party
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
        });

        res.json(updatedBooking);

    } catch (error) {
        console.error("Cancellation Error:", error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                service: true,
                stylist: { select: { businessName: true, userId: true } }, // Include userId to link if needed
                client: { select: { email: true } }
            },
            orderBy: { appointmentDate: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch all bookings' });
    }
};

const deleteBooking = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { stylist: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Authorization: Only the stylist (owner of the profile) can delete
        // Note: We might want to allow Admin too
        if (booking.stylist.userId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized to delete this booking' });
        }

        // Only allow deletion of finally cancelled/rejected/completed items?
        // User asked for "requests that cancelled".
        // Let's be safe: ALLOW deletion if status is CANCELLED*, COMPLETED, or REJECTED (if we had it).
        // If it's PENDING/APPROVED, they should cancel it first.
        const deletableStatuses = ['CANCELED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_TECH', 'COMPLETED', 'REJECTED'];
        if (!deletableStatuses.includes(booking.status)) {
            return res.status(400).json({ error: 'Active bookings cannot be deleted. Please cancel them first.' });
        }

        // Transaction to ensure atomicity
        await prisma.$transaction(async (prisma) => {
            // 1. Delete associated Reviews
            await prisma.review.deleteMany({
                where: { bookingId: id }
            });

            // 2. Find and Delete Conversation + Messages
            const conversation = await prisma.conversation.findUnique({
                where: { bookingId: id }
            });

            if (conversation) {
                await prisma.message.deleteMany({
                    where: { conversationId: conversation.id }
                });
                await prisma.conversation.delete({
                    where: { id: conversation.id }
                });
            }

            // 3. Delete Booking
            await prisma.booking.delete({
                where: { id }
            });
        });

        res.json({ message: 'Booking deleted successfully' });

    } catch (error) {
        console.error("Delete Booking Error:", error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus, cancelBooking, getAllBookings, deleteBooking };
