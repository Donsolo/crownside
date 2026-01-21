const prisma = require('../prisma');

// Helper: Get Weekly Schedule
const getSchedule = async (stylistId) => {
    return await prisma.availabilitySchedule.findMany({
        where: { stylistId },
        orderBy: { dayOfWeek: 'asc' }
    });
};

// Helper: Get Exceptions for a range
const getExceptions = async (stylistId, startDate, endDate) => {
    return await prisma.availabilityException.findMany({
        where: {
            stylistId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });
};

// GET /availability/:stylistId
const getAvailability = async (req, res) => {
    const { stylistId } = req.params;
    const { start, end } = req.query; // Optional date range for exceptions

    try {
        const schedule = await getSchedule(stylistId);

        let exceptions = [];
        if (start && end) {
            exceptions = await getExceptions(stylistId, new Date(start), new Date(end));
        }

        res.json({ schedule, exceptions });
    } catch (error) {
        console.error('Get Availability Error:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
};

// PUT /availability/schedule
const updateSchedule = async (req, res) => {
    const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, isWorkingDay }
    let targetStylistId;

    try {
        // Resolve Stylist ID
        if (req.user.role === 'STYLIST') {
            const profile = await prisma.stylistProfile.findUnique({ where: { userId: req.user.id } });
            if (!profile) return res.status(403).json({ error: 'Stylist profile not found' });
            targetStylistId = profile.id;
        } else if (req.user.role === 'ADMIN') {
            targetStylistId = req.body.stylistId;
            if (!targetStylistId) return res.status(400).json({ error: 'Stylist ID required' });
        } else {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Transactional update
        await prisma.$transaction(
            schedule.map(day =>
                prisma.availabilitySchedule.upsert({
                    where: {
                        stylistId_dayOfWeek: {
                            stylistId: targetStylistId,
                            dayOfWeek: day.dayOfWeek
                        }
                    },
                    update: {
                        startTime: day.startTime,
                        endTime: day.endTime,
                        isWorkingDay: day.isWorkingDay
                    },
                    create: {
                        stylistId: targetStylistId,
                        dayOfWeek: day.dayOfWeek,
                        startTime: day.startTime,
                        endTime: day.endTime,
                        isWorkingDay: day.isWorkingDay
                    }
                })
            )
        );

        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Update Schedule Error:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
};

// POST /availability/exception
const addException = async (req, res) => {
    const { date, isOff, startTime, endTime, reason } = req.body;

    // Stylist ID resolution
    let stylistId;
    if (req.user.role === 'STYLIST') {
        const profile = await prisma.stylistProfile.findUnique({ where: { userId: req.user.id } });
        if (!profile) return res.status(403).json({ error: 'Stylist profile not found' });
        stylistId = profile.id;
    } else {
        // Admin or other logic? For now assume Stylist-only feature
        return res.status(403).json({ error: 'Only stylists can manage availability' });
    }

    try {
        const exception = await prisma.availabilityException.create({
            data: {
                stylistId,
                date: new Date(date),
                isOff,
                startTime,
                endTime,
                reason
            }
        });
        res.status(201).json(exception);
    } catch (error) {
        console.error('Add Exception Error:', error);
        res.status(500).json({ error: 'Failed to add exception' });
    }
};

// Internal Logic to Validate Slot
const checkSlotAvailability = async (stylistId, date, duration) => {
    const checkDate = new Date(date);
    const dayOfWeek = checkDate.getDay();

    // 1. Check Exceptions (Primary Override)
    // We need to fetch exceptions for this SPECIFIC date (ignoring time for match)
    // Prisma Date comparison can be tricky, usually needs ranges.
    const startOfDay = new Date(checkDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkDate); endOfDay.setHours(23, 59, 59, 999);

    const exception = await prisma.availabilityException.findFirst({
        where: {
            stylistId,
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    let workingHours = null;

    if (exception) {
        if (exception.isOff) return { available: false, reason: 'Stylist is off (Exception)' };
        if (exception.startTime && exception.endTime) {
            workingHours = { start: exception.startTime, end: exception.endTime };
        }
    }

    // 2. If no exception (or exception is working with custom hours), Check Weekly Schedule
    if (!workingHours) {
        const schedule = await prisma.availabilitySchedule.findUnique({
            where: {
                stylistId_dayOfWeek: {
                    stylistId,
                    dayOfWeek
                }
            }
        });

        if (!schedule || !schedule.isWorkingDay) {
            return { available: false, reason: 'Stylist is off (Weekly Schedule)' };
        }
        workingHours = { start: schedule.startTime, end: schedule.endTime };
    }

    // 3. Check Slot Constraints
    // Convert slot time to HH:MM for comparison
    const slotHour = checkDate.getHours();
    const slotMinute = checkDate.getMinutes();
    const slotTimeVal = slotHour * 60 + slotMinute;

    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    const slotEndVal = slotTimeVal + duration;

    if (slotTimeVal < startVal || slotEndVal > endVal) {
        return { available: false, reason: `Outside working hours (${workingHours.start} - ${workingHours.end})` };
    }

    // 4. Check Existing Bookings (Overlap)
    const existingBookings = await prisma.booking.findMany({
        where: {
            stylistId,
            status: { notIn: ['CANCELED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_TECH'] },
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    for (const booking of existingBookings) {
        const bStart = new Date(booking.appointmentDate);
        const bDuration = booking.duration || 60; // Default 60 if missing

        const bStartVal = bStart.getHours() * 60 + bStart.getMinutes();
        const bEndVal = bStartVal + bDuration;

        // Overlap Logic: (StartA < EndB) and (EndA > StartB)
        if (slotTimeVal < bEndVal && slotEndVal > bStartVal) {
            return { available: false, reason: 'Slot overlap with existing booking' };
        }
    }

    return { available: true };
};

module.exports = {
    getAvailability,
    updateSchedule,
    addException,
    checkSlotAvailability // Export for internal use in bookingController
};
