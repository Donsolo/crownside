import React, { useState, useEffect } from 'react';
import { Check, Star, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

const PlanSelection = ({ onSelect, selectedPlan }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/subscriptions');
                setPlans(res.data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) return <div className="text-center py-4">Loading plans...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-serif text-crown-dark text-center">Choose Your Membership</h3>

            <div className="grid md:grid-cols-2 gap-4">
                {plans.map(plan => {
                    const isSelected = selectedPlan === plan.key;
                    const isFreeTrial = plan.remainingFreeSlots > 0;

                    return (
                        <div
                            key={plan.key}
                            onClick={() => onSelect(plan.key)}
                            className={`
                                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                                ${isSelected
                                    ? 'border-crown-gold bg-crown-cream/30 shadow-md transform scale-[1.02]'
                                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 text-crown-gold">
                                    <Check size={24} className="bg-crown-gold text-white rounded-full p-1" />
                                </div>
                            )}

                            {plan.key === 'elite' && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-crown-dark text-crown-gold text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Star size={12} fill="currentColor" /> MOST POPULAR
                                </div>
                            )}

                            <h4 className="font-serif text-lg font-bold text-crown-dark">{plan.name}</h4>
                            <div className="flex items-baseline gap-1 my-2">
                                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                                <span className="text-sm text-gray-500">/mo</span>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 h-10">{plan.description}</p>

                            {/* Free Trial Badge */}
                            {isFreeTrial ? (
                                <div className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
                                    <Star size={14} fill="currentColor" />
                                    <span>First 30 Days FREE! ({plan.remainingFreeSlots} spots left)</span>
                                </div>
                            ) : (
                                <div className="bg-gray-50 text-gray-500 text-xs px-3 py-2 rounded-lg mb-4">
                                    Standard pricing applies
                                </div>
                            )}

                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    {plan.key === 'elite' ? 'Hair AND Nails Access' : 'Hair OR Nails Access'}
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    Profile Customization
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    Booking Management
                                </li>
                            </ul>
                        </div>
                    );
                })}
            </div>

            {selectedPlan && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 items-start mt-4">
                    <AlertCircle size={16} className="mt-1 shrink-0" />
                    <p>
                        You selected <strong>{plans.find(p => p.key === selectedPlan)?.name}</strong>.
                        {plans.find(p => p.key === selectedPlan)?.remainingFreeSlots > 0
                            ? " You qualify for the 30-day free trial. No payment required today."
                            : " You will be redirected to payment after registration."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default PlanSelection;
