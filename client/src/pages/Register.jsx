import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [role, setRole] = useState('CLIENT');
    const [step, setStep] = useState(1); // 1: Account, 2: Plan (Stylist only)

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        specialties: [],
        planKey: ''
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

    // Plan selection logic removed - auto-derived from specialties

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
            // planKey is now auto-derived on backend based on count
            if (formData.specialties.length === 0) {
                setError('Please select your specialty.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            // Exclude confirmPassword from payload
            const { confirmPassword, ...payloadData } = formData;
            const payload = { ...payloadData, role };

            const res = await api.post('/auth/register', payload);

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
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-md'} bg-white p-8 rounded-2xl shadow-lg border border-crown-soft transition-all duration-500 animate-enter`}>
                <h2 className="text-3xl font-serif text-center mb-6">
                    {step === 1 ? 'Create Account' : 'Select Your Plan'}
                </h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-medium">{error}</div>}

                {/* Role Toggle - Only visible on Step 1 */}
                {step === 1 && (
                    <div className="flex bg-gray-100 p-1 rounded-full mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('CLIENT')}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${role === 'CLIENT' ? 'bg-white shadow text-crown-dark' : 'text-gray-500'}`}
                        >
                            Client
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('STYLIST')}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${role === 'STYLIST' ? 'bg-white shadow text-crown-dark' : 'text-gray-500'}`}
                        >
                            Beauty Pro
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* STEP 1: Account Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-crown-gray mb-1">Display Name <span className="text-gray-400 text-xs">(Optional)</span></label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-crown-gold focus:outline-none"
                                    placeholder="e.g. Jane Doe"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">This name will be visible to beauty professionals you book with.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-crown-gray mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-crown-gold focus:outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-crown-gray mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-crown-gold focus:outline-none pr-10"
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
                                <label className="block text-sm font-medium text-crown-gray mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-crown-gold focus:outline-none pr-10"
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
                                    <label className="block text-sm font-medium text-crown-gray mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        required={role === 'STYLIST'}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-crown-gold focus:outline-none"
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
                                <h3 className="text-xl font-bold font-serif text-crown-dark">Select Your Services</h3>
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
                                            ? 'border-crown-gold bg-crown-soft/30 shadow-sm'
                                            : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.specialties.includes(service.id)}
                                            onChange={() => toggleSpecialty(service.id)}
                                            className="rounded text-crown-gold focus:ring-crown-gold h-5 w-5 mr-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">{service.label}</div>
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
                                <h3 className="text-xl font-bold font-serif text-crown-dark">Choose Your Plan</h3>
                                <p className="text-gray-500 text-sm">Select the plan that fits your business needs.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-crown-gold/20 to-crown-gold/5 border border-crown-gold/30 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🎁</span>
                                        <div>
                                            <h4 className="font-bold text-crown-dark">Early Access Offer</h4>
                                            <p className="text-sm text-gray-700">The first 30 Beauty Pros get <span className="font-bold">30 Days Free</span>! No commitment, cancel anytime.</p>
                                        </div>
                                    </div>
                                </div>

                                {[
                                    { key: 'pro', label: 'Beauty Pro', price: '$15.00', desc: 'Perfect for getting started. 8 Portfolio Photos.' },
                                    { key: 'elite', label: 'Beauty Pro Elite', price: '$25.00', desc: 'Enhanced visibility. 20 Portfolio Assets + Video.' },
                                    { key: 'premier', label: 'Beauty Pro Premier', price: '$35.00', desc: 'Maximum exposure & priority support. 20+ Assets.' }
                                ].map((plan) => (
                                    <label
                                        key={plan.key}
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.planKey === plan.key
                                            ? 'border-crown-gold bg-crown-soft/30 shadow-sm'
                                            : 'border-gray-100 hover:border-gray-200 bg-gray-50'
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
                                                <div className="font-bold text-gray-900">{plan.label}</div>
                                                <div className="font-bold text-crown-gold">{plan.price}<span className="text-gray-400 text-xs font-normal">/mo</span></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{plan.desc}</div>
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
                                    type="submit"
                                    disabled={!formData.planKey || isSubmitting}
                                    className="flex-1 btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                                </button>
                            </div>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}
