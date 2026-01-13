import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import PlanSelection from '../components/subscription/PlanSelection';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [role, setRole] = useState('CLIENT');
    const [step, setStep] = useState(1); // 1: Account, 2: Plan (Stylist only)

    const [formData, setFormData] = useState({
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

    const handlePlanSelect = (key) => {
        let newSpecialties = [];
        // If Elite, auto-select both
        if (key === 'elite') {
            newSpecialties = ['hair', 'nails'];
        }
        // If switching to Pro, reset specialties to force selection? Or keep if just one?
        // Let's reset to ensure they pick one explicitly to avoid "Hair + Nails" on Pro.
        if (key === 'pro') {
            newSpecialties = [];
        }
        setFormData({ ...formData, planKey: key, specialties: newSpecialties });
    };

    const toggleSpecialty = (spec) => {
        // Validation for Pro plan (Single specialty)
        if (formData.planKey === 'pro') {
            // If they click one, it becomes the only one
            setFormData({ ...formData, specialties: [spec] });
        } else {
            // Standard toggle (though Elite is fixed, maybe prevent changes?)
            if (formData.specialties.includes(spec)) {
                setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== spec) });
            } else {
                setFormData({ ...formData, specialties: [...formData.specialties, spec] });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePasswords()) return;

        setIsSubmitting(true);

        // Validation before submit
        if (role === 'STYLIST') {
            if (!formData.planKey) {
                setError('Please select a subscription plan.');
                setIsSubmitting(false);
                return;
            }
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
        setStep(2);
    };

    const prevStep = () => {
        setError('');
        setStep(1);
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-md'} bg-white p-8 rounded-2xl shadow-lg border border-crown-soft transition-all duration-500`}>
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

                    {/* STEP 2: Plan & Specialties (Stylist Only) */}
                    {step === 2 && role === 'STYLIST' && (
                        <div className="animate-fade-in space-y-8">

                            {/* Plan Selection */}
                            <PlanSelection
                                selectedPlan={formData.planKey}
                                onSelect={handlePlanSelect}
                            />

                            {/* Specialties Logic */}
                            {formData.planKey && (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 animate-slide-up">
                                    <h4 className="font-serif text-lg text-crown-dark mb-2">Confirm Your Expertise</h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {formData.planKey === 'elite'
                                            ? 'The Elite plan includes access to both Hair and Nail services.'
                                            : 'The Beauty Pro plan allows you to specialize in one category.'}
                                    </p>

                                    <div className="flex gap-4">
                                        <label className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer flex-1 transition-all ${formData.specialties.includes('hair') ? 'border-crown-gold bg-white shadow-sm' : 'border-gray-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.specialties.includes('hair')}
                                                onChange={() => toggleSpecialty('hair')}
                                                disabled={formData.planKey === 'elite'} // Locked for Elite
                                                className="rounded text-crown-gold focus:ring-crown-gold h-5 w-5"
                                            />
                                            <span className="font-medium text-gray-800">Hair Services</span>
                                        </label>

                                        <label className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer flex-1 transition-all ${formData.specialties.includes('nails') ? 'border-crown-gold bg-white shadow-sm' : 'border-gray-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.specialties.includes('nails')}
                                                onChange={() => toggleSpecialty('nails')}
                                                disabled={formData.planKey === 'elite'} // Locked for Elite
                                                className="rounded text-crown-gold focus:ring-crown-gold h-5 w-5"
                                            />
                                            <span className="font-medium text-gray-800">Nail Services</span>
                                        </label>
                                    </div>
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
                                    type="submit"
                                    disabled={!formData.planKey || formData.specialties.length === 0 || isSubmitting}
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
