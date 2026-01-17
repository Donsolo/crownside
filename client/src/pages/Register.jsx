import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../config/constants';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';


const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    }
};

function RegisterContent() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const stripe = useStripe();
    const elements = useElements();

    const [role, setRole] = useState('CLIENT');
    const [step, setStep] = useState(1); // 1: Account, 2: Services, 3: Plan, 4: Payment

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        specialties: [],
        planKey: '',
        paymentMethodId: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validatePasswords = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const toggleSpecialty = (spec) => {
        if (formData.specialties.includes(spec)) {
            setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== spec) });
        } else {
            setFormData({ ...formData, specialties: [...formData.specialties, spec] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePasswords()) return;

        setIsSubmitting(true);

        // Validation before submit
        if (role === 'STYLIST') {
            if (formData.specialties.length === 0) {
                setError('Please select your specialty.');
                setIsSubmitting(false);
                return;
            }

            // Stripe Payment Method Creation
            if (!stripe || !elements) {
                setError('Stripe is not loaded yet. Please wait.');
                setIsSubmitting(false);
                return;
            }

            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                setError('Card details not found.');
                setIsSubmitting(false);
                return;
            }

            try {
                const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                    billing_details: {
                        email: formData.email,
                        name: formData.displayName || formData.businessName
                    }
                });

                if (stripeError) {
                    setError(stripeError.message);
                    setIsSubmitting(false);
                    return;
                }

                // Inject Payment Method ID into payload
                await performRegistration({
                    ...formData,
                    role,
                    paymentMethodId: paymentMethod.id
                });

            } catch (err) {
                setError('Payment setup failed: ' + err.message);
                setIsSubmitting(false);
            }

        } else {
            // Client Registration (No Payment)
            await performRegistration({ ...formData, role });
        }
    };

    const performRegistration = async (payloadRaw) => {
        try {
            const { confirmPassword, ...payloadData } = payloadRaw;
            const res = await api.post('/auth/register', payloadData);

            login(res.data.user, res.data.token);

            if (role === 'STYLIST') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            setIsSubmitting(false);
        }
    };

    const nextStep = (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (!validatePasswords()) return;
        }

        if (role === 'STYLIST' && !formData.businessName) {
            setError('Business Name is required.');
            return;
        }
        if (step === 2) {
            if (role === 'STYLIST' && formData.specialties.length === 0) {
                setError('Please select at least one specialty.');
                return;
            }
        }
        if (step === 3) {
            if (role === 'STYLIST' && !formData.planKey) {
                setError('Please select a plan.');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-md'} bg-[var(--card-bg)] p-8 rounded-2xl shadow-lg border border-[var(--card-border)] transition-all duration-500 animate-enter`}>
                <h2 className="text-3xl font-serif text-center mb-6">
                    {step === 1 ? 'Create Account' : 'Select Your Plan'}
                </h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-medium">{error}</div>}

                {/* Role Toggle - Only visible on Step 1 */}
                {step === 1 && (
                    <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-full mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('CLIENT')}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${role === 'CLIENT' ? 'bg-[var(--bg-secondary)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                        >
                            Client
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('STYLIST')}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${role === 'STYLIST' ? 'bg-[var(--bg-secondary)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                        >
                            Beauty Pro
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* STEP 1: Account Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            {role === 'STYLIST' && (
                                <div className="bg-crown-gold/10 border border-crown-gold/30 p-4 rounded-xl flex gap-3 items-start mb-4">
                                    <span className="text-xl">✨</span>
                                    <div>
                                        <h4 className="font-bold text-crown-dark text-sm">Full Earnings Guarantee</h4>
                                        <p className="text-xs text-crown-dark/80 mt-1">
                                            You keep 100% of your service earnings. CrownSide only charges a flat monthly subscription to host your business.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Display Name <span className="text-gray-400 text-xs">(Optional)</span></label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                    placeholder="e.g. Jane Doe"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">This name will be visible to beauty professionals you book with.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none pr-10 transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none pr-10 transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {role === 'STYLIST' && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        required={role === 'STYLIST'}
                                        className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                        placeholder="e.g. Silk Press Studio"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>
                            )}

                            <button
                                onClick={role === 'STYLIST' ? nextStep : handleSubmit}
                                type={role === 'STYLIST' ? 'button' : 'submit'}
                                className="w-full btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition flex justify-center items-center gap-2 mt-4"
                            >
                                {role === 'STYLIST' ? <>Next Step <ChevronRight size={18} /></> : 'Sign Up as Client'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Service Selection (Stylist Only) */}
                    {step === 2 && role === 'STYLIST' && (
                        <div className="animate-fade-in space-y-8">

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold font-serif text-[var(--text-primary)]">Select Your Services</h3>
                                <p className="text-gray-500 text-sm">Select the services you offer. Your plan is automatically calculated based on your selection.</p>
                            </div>

                            {/* Service Toggles */}
                            <div className="grid gap-3">
                                {[
                                    { id: 'hair', label: 'Hair', desc: 'Silk press, braids, styling' },
                                    { id: 'nails', label: 'Nails', desc: 'Manicures, pedicures, acrylics' },
                                    { id: 'lash_brow', label: 'Lash/Brow Tech', desc: 'Extensions, tinting, waxing' }
                                ].map((service) => (
                                    <label
                                        key={service.id}
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.specialties.includes(service.id)
                                            ? 'border-crown-gold bg-[var(--bg-tertiary)] shadow-sm'
                                            : 'border-[var(--card-border)] hover:border-[var(--border-subtle)] bg-[var(--bg-primary)]'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.specialties.includes(service.id)}
                                            onChange={() => toggleSpecialty(service.id)}
                                            className="rounded text-crown-gold focus:ring-crown-gold h-5 w-5 mr-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-[var(--text-primary)]">{service.label}</div>
                                            <div className="text-xs text-gray-500">{service.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={formData.specialties.length === 0}
                                    className="flex-1 btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    Next Step <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Plan Selection (Stylist Only) */}
                    {step === 3 && role === 'STYLIST' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold font-serif text-[var(--text-primary)]">Choose Your Plan</h3>
                                <p className="text-gray-500 text-sm">Select the plan that fits your business needs.</p>
                            </div>

                            <div className="space-y-4">
                                {formData.planKey === 'pro' && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">🎁</span>
                                            <div>
                                                <h4 className="font-bold text-emerald-800">30-Day Free Trial!</h4>
                                                <p className="text-sm text-emerald-700">Select the <span className="font-bold">Beauty Pro</span> plan to get your first month free.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {Object.values(SUBSCRIPTION_TIERS).map((plan) => (
                                    <label
                                        key={plan.key}
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.planKey === plan.key
                                            ? 'border-crown-gold bg-[var(--bg-tertiary)] shadow-sm'
                                            : 'border-[var(--card-border)] hover:border-[var(--border-subtle)] bg-[var(--bg-primary)]'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="planKey"
                                            value={plan.key}
                                            checked={formData.planKey === plan.key}
                                            onChange={(e) => setFormData({ ...formData, planKey: e.target.value })}
                                            className="ml-2 text-crown-gold focus:ring-crown-gold h-5 w-5 mr-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div className="font-bold text-[var(--text-primary)]">{plan.label}</div>
                                                <div className="font-bold text-crown-gold">${plan.price.toFixed(2)}<span className="text-gray-400 text-xs font-normal">/mo</span></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {plan.key === 'pro' && 'Perfect for getting started. 8 Portfolio Photos.'}
                                                {plan.key === 'elite' && 'Enhanced visibility. 20 Portfolio Assets + Video.'}
                                                {plan.key === 'premier' && 'Maximum exposure & priority support. 20+ Assets.'}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!formData.planKey}
                                    className="flex-1 btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    Next: Payment <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Payment (Real Stripe Elements) */}
                    {step === 4 && role === 'STYLIST' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold font-serif text-[var(--text-primary)]">Payment Method</h3>
                                <p className="text-gray-500 text-sm">A valid card is required to activate your subscription.</p>

                                {!stripePromise ? (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs font-bold flex items-center gap-2 justify-center">
                                        <span>⚠️</span>
                                        Payments Disabled (Dev Mode: No Stripe Key)
                                    </div>
                                ) : (
                                    <p className="text-xs text-crown-gold font-bold bg-crown-gold/5 inline-block px-3 py-1 rounded-full border border-crown-gold/20">
                                        Trusted: Your clients will pay YOU directly for services.
                                    </p>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-4">Order Summary</h4>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">{SUBSCRIPTION_TIERS[formData.planKey?.toUpperCase()]?.label}</span>
                                    <span className="font-medium">${SUBSCRIPTION_TIERS[formData.planKey?.toUpperCase()]?.price.toFixed(2)}/mo</span>
                                </div>
                                {formData.planKey === 'pro' ? (
                                    <>
                                        <div className="flex justify-between items-center text-emerald-600 text-sm mb-4">
                                            <span>30-Day Free Trial</span>
                                            <span>-$15.00</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-lg">
                                            <span>Due Today</span>
                                            <span>$0.00</span>
                                        </div>
                                        <p className="text-xs text-center text-gray-400 mt-2">Billing starts automatically after 30 days.</p>
                                    </>
                                ) : (
                                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-lg">
                                        <span>Due Today</span>
                                        <span>${SUBSCRIPTION_TIERS[formData.planKey?.toUpperCase()]?.price.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Real Card Element */}
                            <div className="border border-gray-300 rounded-lg p-4 bg-white">
                                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Card Information</label>
                                <div className="p-1">
                                    {stripePromise ? (
                                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                                    ) : (
                                        <div className="bg-gray-100 p-4 rounded text-center text-gray-400 text-sm italic">
                                            Card Element Unavailable
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100">
                                <div className="font-bold">SECURE</div>
                                <p>This card is for your CrownSide monthly subscription ONLY.</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!stripe || isSubmitting || !stripePromise}
                                    className="flex-1 btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Processing Payment...' : (!stripePromise ? 'Payments Unavailable' : 'Confirm Subscription')}
                                </button>
                            </div>
                        </div>
                    )}

                </form >
            </div >
        </div >
    );
}

// Wrapper for Elements
export default function Register() {
    return <RegisterContent />;
}
