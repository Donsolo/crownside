import { loadStripe } from '@stripe/stripe-js';

// Centralized Stripe Initialization
// This ensures we only load Stripe once and handle missing keys gracefully in dev.

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_KEY) {
    console.warn("⚠️ Stripe Publishable Key not found. Payments will be disabled (Dev Mode).");
}

// Export the promise directly. unique singleton.
// If key is missing, this is null.
export const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
