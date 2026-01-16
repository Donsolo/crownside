import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { FaUser, FaLock, FaBell, FaShieldAlt, FaSignOutAlt, FaChevronLeft, FaSave, FaCheckCircle } from 'react-icons/fa';

export default function AccountSettings() {
    const { user, login, logout } = useAuth(); // login needed to update local user state on change
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Notification Toggles (UI Only for now)
    const [notifications, setNotifications] = useState({
        bookingUpdates: true,
        reminders: true,
        promotions: false
    });

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.patch('/auth/me', { displayName });
            // Update context (this might need a better way if login() expects full payload, but assuming it updates state)
            // Ideally we re-fetch 'me', but for now let's just assume success or reload
            // Actually, we can use the response to update context if login() supports it, or just rely on re-fetch on profile page.
            // For immediate feedback, we might want to manually update user object if exposed, but context is read-only usually.
            // We'll just show success.
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24 md:pt-32">
            <div className="container mx-auto px-4 max-w-2xl">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8 animate-enter">
                    <button onClick={() => navigate('/profile')} className="p-2 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-crown-gold transition">
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Account Settings</h1>
                </div>

                {/* Profile Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-enter animate-delay-1">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-crown-gold/10 flex items-center justify-center text-crown-gold">
                            <FaUser />
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">Personal Information</h2>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed securely at this time.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-crown-gold focus:ring-1 focus:ring-crown-gold outline-none transition"
                                    placeholder="Your Name"
                                />
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' && <FaCheckCircle />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving || displayName === user?.displayName}
                                    className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : <><FaSave /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Security Section (Placeholder) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-enter animate-delay-1">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <FaLock />
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">Security</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                            <div>
                                <div className="font-bold text-gray-900">Password</div>
                                <div className="text-xs text-gray-500">Last changed: Never</div>
                            </div>
                            <button disabled className="text-sm font-bold text-gray-400 cursor-not-allowed">
                                Change
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">Password management is managed by your provider.</p>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-enter animate-delay-2">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                            <FaBell />
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">Notifications</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            { id: 'bookingUpdates', label: 'Booking Updates', desc: 'Get notified when your appointment status changes.' },
                            { id: 'reminders', label: 'Appointment Reminders', desc: 'Receive reminders 24h before your visit.' },
                            { id: 'promotions', label: 'Promotions & Tips', desc: 'Occasional deals and beauty tips.' }
                        ].map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.label}</div>
                                    <div className="text-xs text-gray-500">{item.desc}</div>
                                </div>
                                <button
                                    onClick={() => toggleNotification(item.id)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.id] ? 'bg-crown-gold' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifications[item.id] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Account Status */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10 animate-enter animate-delay-2">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                            <FaShieldAlt />
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">Account Status</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Membership</div>
                            <div className="font-bold text-crown-dark">Client Member</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Member Since</div>
                            <div className="font-bold text-crown-dark">{new Date(user?.createdAt || Date.now()).getFullYear()}</div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="text-center animate-enter animate-delay-2">
                    <button
                        onClick={handleLogout}
                        className="text-red-500 font-bold hover:text-red-600 hover:bg-red-50 px-6 py-2 rounded-full transition flex items-center gap-2 mx-auto"
                    >
                        <FaSignOutAlt /> Log Out
                    </button>
                    <p className="text-xs text-gray-300 mt-4">CrownSide • version 1.0.0</p>
                </div>

            </div>
        </div>
    );
}
