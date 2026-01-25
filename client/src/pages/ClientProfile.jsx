import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Hero from '../components/Hero';
import { FaUser, FaPhoneAlt, FaEnvelope, FaCalendarAlt, FaHistory, FaMapMarkerAlt, FaEdit, FaCamera, FaSignOutAlt, FaUserEdit } from 'react-icons/fa';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function ClientProfile() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Edit Name State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const me = await api.get('/auth/me');
                setUser(me.data);
                setNewName(me.data.displayName || '');
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSaveName = async () => {
        try {
            const res = await api.patch('/auth/me', { displayName: newName });
            setUser(prev => ({ ...prev, displayName: res.data.displayName }));
            setIsEditingName(false);
        } catch (err) {
            alert('Failed to update name');
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Hero Section */}
            <Hero
                pageKey="profile"
                className="h-[40vh] min-h-[300px] flex items-center justify-center relative"
                overlayOpacity={0.7}
            >
                <div className="text-center text-white z-10 px-4">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg text-white">My Profile</h1>
                    <p className="text-white/80 text-lg text-white">Manage your account and preferences</p>
                </div>
            </Hero>

            {/* Content Container - Centered Profile Card */}
            <div className="container mx-auto px-4 relative z-20 -mt-24">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center text-center gap-6 animate-enter animate-delay-1">

                    {/* Avatar */}
                    <div className="relative">
                        <Avatar user={user} size="2xl" className={`shadow-lg bg-white ${user?.isFounderEnrolled ? '' : 'border-4 border-white'}`} />
                        <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Details */}
                    <div className="w-full">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 mb-4 justify-center">
                                <input
                                    className="border rounded px-3 py-1 text-2xl font-bold font-serif text-center w-full max-w-[250px]"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Display Name"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} className="bg-black text-white px-3 py-1.5 rounded text-sm">Save</button>
                                <button onClick={() => setIsEditingName(false)} className="text-gray-500 underline text-sm">Cancel</button>
                            </div>
                        ) : (
                            <div className="group flex items-center gap-3 justify-center mb-2">
                                {user.isFounderEnrolled && <Badge tier="FOUNDER" size="40px" />}
                                <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight">
                                    {user.displayName || user.email?.split('@')[0] || 'Member'}
                                </h2>
                                <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-crown-gold p-1">
                                    <FaUserEdit />
                                </button>
                            </div>
                        )}

                        <p className="text-gray-500 mb-6">{user.email}</p>

                        <div className="flex justify-center gap-2 mb-8 items-center">
                            <span className="px-4 py-1.5 bg-crown-gold/10 text-crown-gold font-bold rounded-full uppercase tracking-wider text-xs">
                                Client Member
                            </span>
                        </div>
                    </div>

                    {/* Actions List */}
                    <div className="w-full space-y-3 max-w-sm">
                        <button
                            onClick={() => navigate('/my-bookings')}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-crown-gold/30 rounded-xl transition shadow-sm hover:shadow-md text-gray-700 font-medium"
                        >
                            <span>My Appointments</span>
                            <span>→</span>
                        </button>

                        <button
                            onClick={() => navigate('/account-settings')}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-crown-gold/30 rounded-xl transition shadow-sm hover:shadow-md text-gray-700 font-medium"
                        >
                            <span>Account Settings</span>
                            <span>→</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-red-100 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-bold mt-4"
                        >
                            <FaSignOutAlt /> Log Out
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-8 pb-8">Member since {new Date(user.createdAt || Date.now()).getFullYear()}</p>
            </div>
        </div>
    );
}
