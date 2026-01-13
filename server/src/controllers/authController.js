const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const crypto = require('crypto');
const { createCustomer } = require('../services/stripeService');

const register = async (req, res) => {
    const { email, password, role, businessName, specialties, planKey, paymentMethodId } = req.body;

    // IP Capture & Hashing
    const ip = req.ip || req.connection.remoteAddress;
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate Stylist Requirements
        if (role === 'STYLIST') {
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
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: role || 'CLIENT',
                },
            });

            // If Stylist, create profile and subscription
            if (role === 'STYLIST') {
                const profile = await tx.stylistProfile.create({
                    data: {
                        userId: user.id,
                        businessName,
                        locationType: 'HOME',
                        specialties: specialties || ['hair']
                    }
                });

                // Subscription Logic (Simplified duplication of selectPlan Logic for now)
                const plan = await tx.subscriptionPlan.findUnique({ where: { key: planKey } });
                if (!plan) throw new Error('Invalid plan selected');

                const existingCount = await tx.professionalSubscription.count({
                    where: { planKey, status: { not: 'CANCELED' } }
                });

                const isFreeTrial = existingCount < plan.freeSlotsLimit;
                let subStatus = isFreeTrial ? 'TRIAL' : 'INACTIVE'; // 'INACTIVE' implies payment needed

                let trialEnds = null;
                if (isFreeTrial) {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + plan.freeTrialDays);
                    trialEnds = endDate;

                    // Auto-activate subscription status on profile for trial
                    await tx.stylistProfile.update({
                        where: { id: profile.id },
                        data: { subscriptionStatus: 'ACTIVE' }
                    });
                }

                await tx.professionalSubscription.create({
                    data: {
                        stylistId: profile.id,
                        planKey,
                        status: subStatus,
                        trialEndsAt: trialEnds,
                        billingStartsAt: trialEnds // Billing starts when trial ends
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

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, createdAt: true, stylistProfile: true }
        });
        res.json(user);
    } catch (error) {
        console.error('getMe Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, getMe };
