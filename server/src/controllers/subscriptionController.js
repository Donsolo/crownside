const prisma = require('../prisma');

const getPlans = async (req, res) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { active: true },
            orderBy: { price: 'asc' }
        });

        // Calculate active slots for each plan to show "Only X spots left!"
        const plansWithStats = await Promise.all(plans.map(async (plan) => {
            const usedSlots = await prisma.professionalSubscription.count({
                where: {
                    planKey: plan.key,
                    status: { in: ['TRIAL', 'ACTIVE'] } // Count both as using a slot for now? Or just Trials? Task says "Free for first 30".
                    // "Free for the first 30 Beauty Pros". This implies we count the Pros who got it for free.
                    // We need to verify if the subscription was actually a "free slot" one.
                    // For MVP simplicity: If current count < limit, next person gets it free.
                }
            });

            return {
                ...plan,
                remainingFreeSlots: Math.max(0, plan.freeSlotsLimit - usedSlots)
            };
        }));

        res.json(plansWithStats);
    } catch (error) {
        console.error('getPlans Error:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

const selectPlan = async (req, res) => {
    const { planKey } = req.body;
    const userId = req.user.id; // User ID from token

    if (!planKey) {
        return res.status(400).json({ error: 'Plan key is required' });
    }

    try {
        // 1. Get Stylist Profile
        const stylist = await prisma.stylistProfile.findUnique({
            where: { userId: userId }
        });

        if (!stylist) {
            return res.status(404).json({ error: 'Stylist profile not found' });
        }

        // 2. Get Plan Details
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { key: planKey }
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // 3. Check Free Slot Availability
        // "First 30 Beauty Pros" logic
        const existingSubscriptionsCount = await prisma.professionalSubscription.count({
            where: {
                planKey: planKey,
                // We count all subscriptions created for this plan as "taking a slot" 
                // regardless of status being TRIAL, to prevent recycling slots aggressively?
                // Or strictly active ones. Let's count all non-canceled for safety.
                status: { not: 'CANCELED' }
            }
        });

        const isFreeTrial = existingSubscriptionsCount < plan.freeSlotsLimit;

        let subStatus = 'TRIAL';
        let trialEnds = null;
        let billingStarts = null;

        if (isFreeTrial) {
            // Calculate trial end date
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.freeTrialDays);
            trialEnds = endDate;
            billingStarts = endDate;
            subStatus = 'TRIAL'; // Active immediately as trial
        } else {
            // Not free - Stripe flow would start here
            // For now, we set them to 'INACTIVE' or 'PENDING' waiting for payment
            subStatus = 'INACTIVE'; // Requires payment to activate
            // In a real flow, we'd return a Stripe Checkout session ID here
        }

        // 4. Create/Update Subscription
        const subscription = await prisma.professionalSubscription.upsert({
            where: { stylistId: stylist.id },
            update: {
                planKey,
                status: subStatus,
                trialEndsAt: trialEnds,
                billingStartsAt: billingStarts,
                updatedAt: new Date()
            },
            create: {
                stylistId: stylist.id,
                planKey,
                status: subStatus,
                trialEndsAt: trialEnds,
                billingStartsAt: billingStarts
            }
        });

        // 5. Update Stylist Specialties if needed (Entitlement enforcement helper)
        if (planKey === 'elite') {
            // Elite gets both
            await prisma.stylistProfile.update({
                where: { id: stylist.id },
                data: {
                    specialties: ['hair', 'nails'],
                    subscriptionStatus: subStatus === 'TRIAL' ? 'ACTIVE' : 'INACTIVE' // Sync legacy status
                }
            });
        }
        // If 'pro', we expect the user to have chosen main specialty during onboarding. 
        // We don't overwrite it here unless passed, but this endpoint is just checking out.

        res.json({
            subscription,
            isFreeTrial,
            message: isFreeTrial ? 'Free trial actived!' : 'Payment required.',
            checkoutRequired: !isFreeTrial
        });

    } catch (error) {
        console.error('selectPlan Error:', error);
        res.status(500).json({ error: 'Failed to select plan' });
    }
};

const adminUpdatePlan = async (req, res) => {
    const { key } = req.params;
    const { price, freeSlotsLimit, freeTrialDays, active } = req.body;

    try {
        const updatedPlan = await prisma.subscriptionPlan.update({
            where: { key },
            data: {
                price,
                freeSlotsLimit,
                freeTrialDays,
                active
            }
        });
        res.json(updatedPlan);
    } catch (error) {
        console.error('adminUpdatePlan Error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

const getSubscriptionStatus = async (req, res) => {
    const userId = req.user.id;

    try {
        const stylist = await prisma.stylistProfile.findUnique({
            where: { userId },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!stylist || !stylist.subscription) {
            return res.json({ status: 'NO_SUBSCRIPTION', plan: null });
        }

        res.json({
            status: stylist.subscription.status,
            plan: stylist.subscription.plan,
            trialEndsAt: stylist.subscription.trialEndsAt,
            billingStartsAt: stylist.subscription.billingStartsAt,
            subscriptionId: stylist.subscription.id
        });
    } catch (error) {
        console.error('getSubscriptionStatus Error:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
};

const cancelSubscription = async (req, res) => {
    const userId = req.user.id;

    try {
        const stylist = await prisma.stylistProfile.findUnique({
            where: { userId },
            include: { subscription: true }
        });

        if (!stylist || !stylist.subscription) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        // In a real Stripe app, we would call stripe.subscriptions.cancel(subId) here.
        // For now, we update the DB status.

        await prisma.professionalSubscription.update({
            where: { id: stylist.subscription.id },
            data: {
                status: 'CANCELED',
                updatedAt: new Date()
            }
        });

        // Also update the StylistProfile to sync status (optional, but good for redundancy)
        await prisma.stylistProfile.update({
            where: { id: stylist.id },
            data: { subscriptionStatus: 'CANCELED' }
        });

        res.json({ message: 'Subscription canceled successfully' });
    } catch (error) {
        console.error('cancelSubscription Error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
};

module.exports = { getPlans, selectPlan, adminUpdatePlan, getSubscriptionStatus, cancelSubscription };
