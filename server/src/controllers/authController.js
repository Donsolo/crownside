const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const crypto = require('crypto');
const { createCustomer, createSubscription } = require('../services/stripeService');

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
                    return res.status(400).json({ error: 'Payment method required.' });
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
                    role: userRole, // Use userRole not role
                    displayName: displayName || (userRole === 'STYLIST' ? businessName : 'Client'),
                }
            });

            if (userRole === 'STYLIST') {
                const profile = await tx.stylistProfile.create({
                    data: {
                        userId: user.id,
                        businessName: businessName || 'My Business',
                        locationType: 'HOME',
                        specialties: specialties || [],
                        subscriptionStatus: 'ACTIVE' // Will be managed by subscription relation
                    }
                });

                // Using explicit planKey passed from frontend
                const derivedPlanKey = (planKey || 'pro').toLowerCase();

                // Subscription Logic
                const plan = await tx.subscriptionPlan.findUnique({ where: { key: derivedPlanKey } });
                if (!plan) throw new Error(`Invalid plan selected: ${derivedPlanKey}`);

                // Real Stripe Integration
                // 1. Create Customer & Attach Payment Method
                const stripeCustomer = await createCustomer(email, paymentMethodId);

                // 2. Create Subscription (Trial logic handled in service based on planKey)
                const subscription = await createSubscription(stripeCustomer.id, derivedPlanKey);

                // 3. Map Stripe Status to DB Status
                let subStatus = 'INACTIVE';
                if (subscription.status === 'active') subStatus = 'ACTIVE';
                else if (subscription.status === 'trialing') subStatus = 'TRIAL';

                // 4. Extract Dates
                const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
                const billingStartsAt = trialEndsAt || new Date(subscription.current_period_start * 1000);

                await tx.professionalSubscription.create({
                    data: {
                        stylistId: profile.id,
                        planKey: plan.key,
                        status: subStatus,
                        stripeCustomerId: stripeCustomer.id,
                        stripeSubscriptionId: subscription.id,
                        trialEndsAt: trialEndsAt,
                        billingStartsAt: billingStartsAt
                    }
                });

                // Record Trial Usage if applicable
                if (subStatus === 'TRIAL') {
                    // Start Trial logic - check if trialUsage exists again or rely on unique constraint?
                    // We checked above, but race condition possible. 
                    // Silent fail or atomic insert? 
                    // upsert is safe
                    await tx.trialUsage.upsert({
                        where: { ipHash },
                        update: {},
                        create: { ipHash }
                    });
                }
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
            select: { id: true, email: true, role: true, displayName: true, themePreference: true, createdAt: true, stylistProfile: true }
        });
        res.json(user);
    } catch (error) {
        console.error('getMe Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

const updateMe = async (req, res) => {
    try {
        const { displayName, themePreference } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                displayName: displayName ? displayName.trim() : undefined,
                themePreference: themePreference ? themePreference : undefined
            },
            select: { id: true, email: true, role: true, displayName: true, themePreference: true, createdAt: true }
        });
        res.json(updated);
    } catch (error) {
        console.error('updateMe Error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

module.exports = { register, login, getMe, updateMe };
