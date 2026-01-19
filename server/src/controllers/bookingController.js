const prisma = require('../prisma');

const createBooking = async (req, res) => {
    const clientId = req.user.id;
    const { stylistId, serviceId, appointmentDate, notes } = req.body;
    console.log(`Creating booking: User ${req.user.id} Role: ${req.user.role}`);

    try {
        // Validate Stylist and Service
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return res.status(404).json({ error: 'Service not found' });

        // Prevent self-booking if needed, or allow it for testing
        // if (req.user.role === 'STYLIST') { ... check if stylistId matches profile ... }

        // Create Booking
        const booking = await prisma.booking.create({
            data: {
                clientId,
                stylistId,
                serviceId,
                appointmentDate: new Date(appointmentDate), // Ensure Date object
                status: 'PENDING',
                notes
            }
        });

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
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
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

module.exports = { createBooking, getMyBookings, updateBookingStatus, getAllBookings };
