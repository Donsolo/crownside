import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Edit2, Save, X, Check, Activity } from 'lucide-react';

export default function AdminSubscriptions() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingKey, setEditingKey] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Fetch Plans
    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions'); // Re-using public endpoint which now sends stats
            setPlans(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const startEdit = (plan) => {
        setEditingKey(plan.key);
        setEditForm({ ...plan });
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        try {
            await api.put(`/subscriptions/admin/plans/${editingKey}`, editForm);
            setEditingKey(null);
            fetchPlans(); // Refresh to get updated stats/data
        } catch (err) {
            alert('Failed to update plan');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Subscription Data...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-24">
            <h1 className="text-3xl font-serif text-crown-dark mb-2">Subscription & Pricing</h1>
            <p className="text-gray-500 mb-8">Manage pricing tiers, free trial limits, and view utilization.</p>

            <div className="grid md:grid-cols-2 gap-8">
                {plans.map(plan => {
                    const isEditing = editingKey === plan.key;
                    const usedSlots = plan.freeSlotsLimit - plan.remainingFreeSlots;
                    const percentUsed = (usedSlots / plan.freeSlotsLimit) * 100;

                    return (
                        <div key={plan.key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="bg-crown-cream/20 p-6 border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">{plan.key.toUpperCase()} TIER</span>
                                    <h2 className="text-2xl font-serif font-bold text-crown-dark mt-1">{plan.name}</h2>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${plan.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {plan.active ? 'ACTIVE' : 'DISABLED'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Price Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Monthly Price</label>
                                        {isEditing ? (
                                            <div className="flex items-center">
                                                <span className="mr-1 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full border rounded p-1"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-gray-800">${plan.price}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Free Trial Duration</label>
                                        {isEditing ? (
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    className="w-20 border rounded p-1 mr-1"
                                                    value={editForm.freeTrialDays}
                                                    onChange={(e) => setEditForm({ ...editForm, freeTrialDays: parseInt(e.target.value) })}
                                                />
                                                <span className="text-gray-500">Days</span>
                                            </div>
                                        ) : (
                                            <div className="text-lg font-medium text-gray-800">{plan.freeTrialDays} Days</div>
                                        )}
                                    </div>
                                </div>

                                {/* Free Slot Usage Visualization */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase">Free Slot Utilization</label>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">Limit:</span>
                                                <input
                                                    type="number"
                                                    className="w-20 border rounded p-1 text-sm"
                                                    value={editForm.freeSlotsLimit}
                                                    onChange={(e) => setEditForm({ ...editForm, freeSlotsLimit: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm font-medium text-crown-dark">
                                                {usedSlots} / {plan.freeSlotsLimit} Used
                                            </span>
                                        )}

                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${percentUsed > 90 ? 'bg-red-400' : 'bg-crown-gold'}`}
                                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {plan.remainingFreeSlots} spots remaining for new {plan.name} users.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    {isEditing ? (
                                        <>
                                            <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition">
                                                <X size={20} />
                                            </button>
                                            <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-crown-dark text-white rounded-full hover:bg-black transition text-sm">
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => startEdit(plan)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition text-sm text-gray-600">
                                            <Edit2 size={16} /> Edit Configuration
                                        </button>
                                    )}
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
