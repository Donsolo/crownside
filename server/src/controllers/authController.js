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
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: userRole,
                },
            });

            // If Stylist, create profile and subscription
            if (userRole === 'STYLIST') {
                // Create Stripe Customer (Safe Mock if keys missing)
                let stripeCustomerId = null;
                try {
                    const customer = await createCustomer(email, paymentMethodId);
                    stripeCustomerId = customer.id;
                } catch (e) {
                    console.warn("Stripe Customer Creation Warning:", e.message);
                    // Non-blocking failure for MVP/Pre-live
                }

                const profile = await tx.stylistProfile.create({
                    data: {
                        userId: user.id,
                        businessName,
                        locationType: 'HOME',
                        specialties: specialties || ['hair'],
                        stripeCustomerId: stripeCustomerId
                    }
                });

                // Auto-derive plan based on specialty count
                const count = (specialties || []).length;
                let derivedPlanKey = 'pro';
                if (count === 2) derivedPlanKey = 'elite';
                if (count >= 3) derivedPlanKey = 'premier';

                // Subscription Logic
                const plan = await tx.subscriptionPlan.findUnique({ where: { key: derivedPlanKey } });
                if (!plan) throw new Error(`Invalid derived plan: ${derivedPlanKey}`);

                const existingCount = await tx.professionalSubscription.count({
                    where: { planKey: derivedPlanKey, status: { not: 'CANCELED' } }
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
                        planKey: derivedPlanKey,
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
