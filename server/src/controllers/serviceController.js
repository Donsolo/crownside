const prisma = require('../prisma');

const addService = async (req, res) => {
    const userId = req.user.id;
    const { name, price, duration, deposit, category } = req.body;

    try {
        const stylist = await prisma.stylistProfile.findUnique({
            where: { userId }
        });

        if (!stylist) return res.status(404).json({ error: 'Stylist profile not found' });

        const serviceCategory = category || 'hair';



        const service = await prisma.service.create({
            data: {
                stylistId: stylist.id,
                name,
                price,
                duration: parseInt(duration),
                deposit: deposit || 0,
                category: serviceCategory,
            }
        });

        res.status(201).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add service' });
    }
};

const updateService = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, price, duration, deposit, category } = req.body;

    try {
        // Verify ownership
        const service = await prisma.service.findUnique({
            where: { id },
            include: { stylist: true }
        });

        if (!service || service.stylist.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to edit this service' });
        }

        const updated = await prisma.service.update({
            where: { id },
            data: {
                name,
                price,
                duration: parseInt(duration),
                deposit,
                category,
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update service' });
    }
};

const deleteService = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Verify ownership
        const service = await prisma.service.findUnique({
            where: { id },
            include: { stylist: true }
        });

        if (!service || service.stylist.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this service' });
        }

        await prisma.service.delete({ where: { id } });

        res.json({ message: 'Service deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
};

module.exports = { addService, updateService, deleteService };
