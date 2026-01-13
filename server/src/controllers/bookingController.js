const prisma = require('../prisma');

const createBooking = async (req, res) => {
    const clientId = req.user.id;
    const { stylistId, serviceId, appointmentDate, notes } = req.body;

    try {
        // Validate Stylist and Service
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return res.status(404).json({ error: 'Service not found' });

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

    try {
        let whereClause = {};
        if (role === 'CLIENT') {
            whereClause = { clientId: userId };
        } else if (role === 'STYLIST') {
            const profile = await prisma.stylistProfile.findUnique({ where: { userId } });
            if (!profile) return res.json([]); // No profile yet
            whereClause = { stylistId: profile.id };
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                service: true,
                stylist: { select: { businessName: true } },
                client: { select: { email: true } } // For stylists to see who booked
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
