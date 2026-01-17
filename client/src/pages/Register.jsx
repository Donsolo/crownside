import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../config/constants';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

            const cardElement = elements.getElement(CardNumberElement);
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

                            <div className="flex flex-col gap-5">
                                {Object.values(SUBSCRIPTION_TIERS).map((plan) => {
                                    const isSelected = formData.planKey === plan.key;
                                    const isPro = plan.key === 'pro';
                                    const isElite = plan.key === 'elite';
                                    const isPremier = plan.key === 'premier';

                                    const getCardStyle = () => {
                                        if (isSelected) {
                                            if (isPro) return 'border-crown-gold bg-[var(--bg-tertiary)] shadow-lg scale-[1.02]';
                                            if (isElite) return 'border-crown-gold bg-gradient-to-br from-[var(--bg-primary)] to-[var(--crown-soft)] shadow-xl scale-[1.03] ring-1 ring-crown-gold/30';
                                            if (isPremier) return 'border-crown-dark bg-[var(--crown-cream)] shadow-2xl scale-[1.04] ring-1 ring-crown-dark/20';
                                        }
                                        // Unselected States
                                        if (isPro) return 'border-[var(--card-border)] bg-[var(--bg-primary)] hover:border-crown-gold/30 hover:shadow-md';
                                        if (isElite) return 'border-[var(--card-border)] bg-[var(--bg-primary)] hover:border-crown-gold/50 hover:shadow-lg';
                                        if (isPremier) return 'border-[var(--card-border)] bg-[var(--bg-primary)] hover:border-crown-dark/40 hover:shadow-xl';
                                        return '';
                                    };

                                    return (
                                        <div
                                            key={plan.key}
                                            onClick={() => setFormData({ ...formData, planKey: plan.key })}
                                            className={`relative group cursor-pointer rounded-2xl transition-all duration-300 border-2 overflow-hidden ${getCardStyle()}`}
                                        >
                                            {/* Selection Indicator (Radio Ring) */}
                                            <div className="absolute top-6 right-6 z-10">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                    ${isSelected ? 'border-crown-gold' : 'border-gray-300 group-hover:border-crown-gold/50'}`}>
                                                    <div className={`w-3 h-3 rounded-full bg-crown-gold transition-all duration-300 ${isSelected ? 'scale-100' : 'scale-0'}`} />
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            {isPro && (
                                                <div className="absolute top-0 left-0 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-4 py-1.5 rounded-br-xl uppercase tracking-wider border-r border-b border-emerald-100 shadow-sm flex items-center gap-1">
                                                    <span>💎</span> 30-Day Free Trial
                                                </div>
                                            )}
                                            {isElite && (
                                                <div className="absolute top-0 left-0 bg-crown-gold text-white text-[10px] font-bold px-4 py-1.5 rounded-br-xl uppercase tracking-wider shadow-md flex items-center gap-1">
                                                    <span>✨</span> Most Popular
                                                </div>
                                            )}
                                            {isPremier && (
                                                <div className="absolute top-0 left-0 bg-crown-dark text-crown-gold text-[10px] font-bold px-5 py-1.5 rounded-br-xl uppercase tracking-widest shadow-lg border-r border-b border-crown-gold/20 flex items-center gap-1">
                                                    <span>👑</span> Premier Access
                                                </div>
                                            )}

                                            <div className="p-6 pt-10">
                                                {/* Header & Price */}
                                                <div className="pr-10">
                                                    <h4 className={`font-serif text-xl font-bold transition-colors mb-1 ${isSelected || isPremier ? 'text-crown-dark' : 'text-gray-600'}`}>
                                                        {plan.label}
                                                    </h4>

                                                    {/* Pro Trial Subtitle */}
                                                    {isPro && (
                                                        <p className="text-xs text-emerald-600 font-bold mb-1">
                                                            No charge today. Cancel anytime.
                                                        </p>
                                                    )}

                                                    <div className="flex items-baseline gap-1 mt-2">
                                                        <span className="text-2xl font-bold text-crown-gold">${plan.price.toFixed(0)}</span>
                                                        <span className="text-gray-400 text-sm">/month</span>
                                                    </div>
                                                </div>

                                                {/* Features / Desc */}
                                                <div className={`mt-4 pt-4 border-t space-y-2 ${isPremier ? 'border-crown-dark/10' : 'border-gray-100'}`}>
                                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                                        {isPro && "Establish your business with a professional storefront."}
                                                        {isElite && "Expand your reach and attract more clients."}
                                                        {isPremier && "Dominate your market with maximum exposure."}
                                                    </p>

                                                    <div className="space-y-1.5 pt-1">
                                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                                            <span className={isSelected ? "text-crown-gold" : "text-gray-400"}>✓</span>
                                                            {isPro && "8 Portfolio Photos"}
                                                            {isElite && "20 Portfolio Photos + Video"}
                                                            {isPremier && "Unlimited Portfolio Assets"}
                                                        </p>
                                                        {isPremier && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                                <span className="text-crown-gold">✓</span>
                                                                Priority Support & Verified Badge
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Free Trial Note - Subtle & Integrated */}
                            {formData.planKey === 'pro' && (
                                <div className="text-center animate-fade-in">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                                        <span>🎉</span> You've selected the 30-Day Free Trial
                                    </span>
                                </div>
                            )}

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

                    {/* STEP 4: Payment (Split Fields Redesign) */}
                    {step === 4 && role === 'STYLIST' && (
                        <div className="animate-fade-in space-y-8">

                            {/* Header Section */}
                            <div className="text-center space-y-3">
                                <span className="text-4xl">🔒</span>
                                <h3 className="text-2xl font-bold font-serif text-[var(--text-primary)]">Secure Checkout</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Your 30-day trial is free. Cancel anytime.
                                </p>

                                {!stripePromise ? (
                                    <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs font-bold flex items-center gap-2 justify-center">
                                        <span>⚠️</span>
                                        Payments Disabled (Dev Mode)
                                    </div>
                                ) : (
                                    <div className="flex justify-center gap-2 mt-2">
                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Encrypted by Stripe
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary Card */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Subscription Plan</h4>
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-gray-800 font-bold text-lg">{SUBSCRIPTION_TIERS[formData.planKey?.toUpperCase()]?.label}</span>
                                    <span className="font-serif text-xl">${SUBSCRIPTION_TIERS[formData.planKey?.toUpperCase()]?.price.toFixed(2)}<span className="text-sm text-gray-500 font-sans">/mo</span></span>
                                </div>
                                {formData.planKey === 'pro' && (
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                        <span>🎉 30-Day Free Trial Applied</span>
                                    </div>
                                )}
                            </div>

                            {/* Payment Form */}
                            <div className="space-y-5">
                                <div className="space-y-4">
                                    {/* Card Number */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Number</label>
                                        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm focus-within:ring-2 focus-within:ring-crown-gold focus-within:border-transparent transition-all">
                                            {stripePromise ? (
                                                <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                                            ) : (
                                                <div className="text-gray-300 text-sm italic">Input Disabled</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Expiry */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiration</label>
                                            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm focus-within:ring-2 focus-within:ring-crown-gold transition-all">
                                                {stripePromise ? (
                                                    <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                                                ) : (
                                                    <div className="text-gray-300 text-sm italic">-- / --</div>
                                                )}
                                            </div>
                                        </div>
                                        {/* CVC */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVC</label>
                                            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm focus-within:ring-2 focus-within:ring-crown-gold transition-all">
                                                {stripePromise ? (
                                                    <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                                                ) : (
                                                    <div className="text-gray-300 text-sm italic">123</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Footer */}
                                <div className="bg-crown-gold/5 rounded-xl p-4 border border-crown-gold/10 text-center space-y-2">
                                    <p className="text-xs text-crown-dark font-medium">
                                        Clients pay you directly for services.
                                    </p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        CrownSide never stores your card details. This card is strictly for your monthly hosting subscription.
                                    </p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={!stripe || isSubmitting || !stripePromise}
                                    className="w-full btn-primary bg-crown-dark text-white py-4 rounded-full hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-bold text-lg flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin">⏳</span> Processing...
                                        </>
                                    ) : (
                                        !stripePromise ? 'Payments Disabled' : (formData.planKey === 'pro' ? 'Start Free Trial' : 'Confirm Subscription')
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="w-full py-3 text-sm text-gray-500 hover:text-gray-800 transition font-medium"
                                >
                                    Go Back
                                </button>

                                {formData.planKey === 'pro' && (
                                    <p className="text-center text-[10px] text-gray-400 mt-2">
                                        You won't be charged today.
                                    </p>
                                )}
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
