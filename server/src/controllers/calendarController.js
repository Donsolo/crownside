const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

// Get Calendar Events (Bookings + Blockouts)
exports.getCalendarEvents = async (req, res) => {
    try {
        const { start, end } = req.query;
        const stylistId = req.user.stylistProfile?.id; // Assumes auth middleware populates this

        if (!stylistId) {
            return res.status(403).json({ error: 'Stylist profile required' });
        }

        // Validate dates
        if (!start || !end) {
            return res.status(400).json({ error: 'Start and End dates required' });
        }

        const bookings = await prisma.booking.findMany({
            where: {
                stylistId,
                appointmentDate: {
                    gte: new Date(start),
                    lte: new Date(end),
                },
            },
            include: {
                client: {
                    select: { displayName: true, email: true, profileImage: true, phoneNumber: true } // CrownSide Client
                },
                stylistClient: true, // Manual/Imported Client
                service: true,
            },
        });

        // Format events for Frontend (e.g. FullCalendar or custom)
        const events = bookings.map(b => {
            // Duration Priority: Booking Override > Service Duration > Default 60
            const duration = b.duration || b.service?.duration || 60;
            const startTime = new Date(b.appointmentDate);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            return {
                id: b.id,
                title: b.isBlockout ? (b.notes || 'Blocked') : (b.service?.name || 'Appointment'),
                start: b.appointmentDate,
                end: endTime,
                duration: duration,
                isBlockout: b.isBlockout,
                status: b.status,
                clientName: b.client?.displayName || b.stylistClient?.name || 'Unknown Client',
                clientPhone: b.client?.phoneNumber || b.stylistClient?.phone,
                serviceName: b.service?.name,
                servicePrice: b.service?.price,
                notes: b.notes,
                type: b.importSource ? 'IMPORTED' : (b.isBlockout ? 'BLOCKOUT' : 'BOOKING'),
                color: b.isBlockout ? '#fee2e2' : undefined // Basic color hint, UI handles styling
            };
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Create Blockout
exports.createBlockout = async (req, res) => {
    try {
        const { start, duration, notes } = req.body;
        const stylistId = req.user.stylistProfile?.id;

        if (!stylistId) return res.status(403).json({ error: 'Stylist profile required' });

        const startDate = new Date(start);
        const durationMin = parseInt(duration) || 60;

        const blockout = await prisma.booking.create({
            data: {
                stylistId,
                appointmentDate: startDate,
                duration: durationMin,
                isBlockout: true,
                notes: notes || 'Busy',
                status: 'APPROVED', // Blockouts are effectively approved
                importSource: 'MANUAL',
            }
        });

        res.json(blockout);
    } catch (error) {
        console.error('Create blockout error:', error);
        res.status(500).json({ error: 'Failed to create blockout' });
    }
};

// Get Clients (Rolodex)
exports.getClients = async (req, res) => {
    try {
        const stylistId = req.user.stylistProfile?.id;
        if (!stylistId) return res.status(403).json({ error: 'Stylist profile required' });

        const clients = await prisma.stylistClient.findMany({
            where: { stylistId },
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { bookings: true } }
            }
        });

        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// Create Client (Manual)
exports.createClient = async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;
        const stylistId = req.user.stylistProfile?.id;
        if (!stylistId) return res.status(403).json({ error: 'Stylist profile required' });

        const client = await prisma.stylistClient.create({
            data: {
                stylistId,
                name,
                email,
                phone,
                notes,
                importSource: 'MANUAL'
            }
        });

        res.json(client);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// Import Clients & Bookings (Stub)
exports.importData = async (req, res) => {
    try {
        const { source } = req.body; // 'BOOKSY', 'CSV'
        const file = req.file; // Assuming multer handles upload
        const stylistId = req.user.stylistProfile?.id;

        if (!stylistId) return res.status(403).json({ error: 'Stylist profile required' });
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const results = { imported: 0, errors: [] };

        // Basic CSV Parsing Logic
        if (source === 'CSV' || source === 'BOOKSY') {
            const stream = Readable.from(file.buffer);

            await new Promise((resolve, reject) => {
                stream
                    .pipe(csv())
                    .on('data', async (row) => {
                        try {
                            // Basic mapping (adjust based on actual Booksy/CSV format later)
                            const name = row['Client Name'] || row['Name'] || row['name'];
                            const email = row['Email'] || row['email'];
                            const phone = row['Phone'] || row['phone'] || row['Mobile'];

                            if (name) {
                                await prisma.stylistClient.create({
                                    data: {
                                        stylistId,
                                        name,
                                        email,
                                        phone,
                                        importSource: source,
                                        importId: row['Client Id'] || undefined
                                    }
                                });
                                results.imported++;
                            }
                        } catch (err) {
                            // Ignore duplicates or specific errors
                        }
                    })
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err));
            });
        }

        res.json({ message: 'Import processed', stats: results });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Import failed' });
    }
};
