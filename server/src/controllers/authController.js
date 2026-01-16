const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const crypto = require('crypto');
const { createCustomer } = require('../services/stripeService');

const register = async (req, res) => {
    const { email, password, role, businessName, specialties, planKey, paymentMethodId, displayName } = req.body;

    // IP Capture & Hashing
    const ip = req.ip || req.connection.remoteAddress;
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Auto-Make Admin
    let userRole = role || 'CLIENT';
    if (email.toLowerCase() === 'tektriq@gmail.com') {
        userRole = 'ADMIN';
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate Stylist Requirements
        if (userRole === 'STYLIST') {
            if (!businessName) return res.status(400).json({ error: 'Business name required for stylists' });
            if (!planKey) return res.status(400).json({ error: 'Subscription plan required' });
            if (!specialties || specialties.length === 0) return res.status(400).json({ error: 'At least one specialty required' });

            // Check for Trial Abuse
            if (process.env.BILLING_ENFORCED !== 'false') {
                const existingTrial = await prisma.trialUsage.findUnique({ where: { ipHash } });
                if (existingTrial) {
                    return res.status(403).json({ error: 'Free trial already claimed from this network.' });
                }

                // Require Payment Method
                if (!paymentMethodId) {
                    return res.status(400).json({ error: 'Payment method required for free trial.' });
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure atomic creation
        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role,
                    displayName: displayName || (role === 'STYLIST' ? businessName : 'Client'),
                }
            });

            if (role === 'STYLIST') {
                const profile = await tx.stylistProfile.create({
                    data: {
                        userId: user.id,
                        businessName: businessName || 'My Business',
                        locationType: locationType || 'HOME',
                        specialties: specialties || [],
                        subscriptionStatus: 'ACTIVE' // Will be managed by subscription relation
                    }
                });

                // Using explicit planKey passed from frontend
                const derivedPlanKey = (planKey || 'pro').toLowerCase();

                // Subscription Logic & Early Access Check
                const plan = await tx.subscriptionPlan.findUnique({ where: { key: derivedPlanKey } });
                if (!plan) throw new Error(`Invalid plan selected: ${derivedPlanKey}`);

                // Check active count for Early Access
                const activeSubsCount = await tx.professionalSubscription.count({
                    where: { status: { in: ['ACTIVE', 'TRIAL'] } }
                });

                let subStatus = 'ACTIVE';
                let trialEndsAt = null;

                // First 30 Users get 30 Days Free
                if (activeSubsCount < 30) {
                    subStatus = 'TRIAL';
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30);
                    trialEndsAt = endDate;
                }

                await tx.professionalSubscription.create({
                    data: {
                        stylistId: profile.id,
                        planKey: plan.key,
                        status: subStatus,
                        trialEndsAt: trialEndsAt,
                        billingStartsAt: trialEndsAt // Billing starts when trial ends
                    }
                });
            }

            return user;
        });

        const token = jwt.sign({ id: result.id, role: result.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: result.id, email: result.email, role: result.role } });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Admin Bootstrap Rule: Auto-promote specific user on login
        if (email.toLowerCase() === 'tektriq@gmail.com' && user.role !== 'ADMIN') {
            console.log(`Bootstrap: Promoting ${email} to ADMIN`);
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' }
            });
            user.role = updatedUser.role; // Update local user object for token generation
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, displayName: true, createdAt: true, stylistProfile: true }
        });
        res.json(user);
    } catch (error) {
        console.error('getMe Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateMe = async (req, res) => {
    try {
        const { displayName } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                displayName: displayName ? displayName.trim() : undefined
            },
            select: { id: true, email: true, role: true, displayName: true, createdAt: true }
        });
        res.json(updated);
    } catch (error) {
        console.error('updateMe Error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

module.exports = { register, login, getMe, updateMe };
