import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PortfolioManager from '../components/PortfolioManager';
import Hero from '../components/Hero';
import { SERVICE_CATEGORIES } from '../config/categories';
import { FaUserCircle, FaCut, FaCamera, FaCalendarCheck, FaCreditCard, FaStore, FaArrowLeft, FaCheckCircle, FaMapMarkerAlt, FaTrash, FaInfoCircle, FaTimes } from 'react-icons/fa';

export default function StylistDashboard() {
    const [activeView, setActiveView] = useState('home'); // 'home', 'profile', 'services', 'portfolio', 'bookings', 'billing'
    const navigate = useNavigate();
    const { logout, user: authUser, loading: authLoading } = useAuth();
    const { counts, markBookingsSeen } = useNotifications();
    const location = useLocation();

    // Reset chat/views when navigating to dashboard (even if from dashboard)
    useEffect(() => {
        // Resetting view to home naturally unmounts BookingManager/Chat
        setActiveView('home');
    }, [location]);

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for global auth to finish (restore from localStorage)
        if (authLoading) return;

        // If not logged in after auth finishes, redirect
        if (!authUser) {
            navigate('/login');
            return;
        }

        const fetchDashboardData = async () => {
            const fetchWithRetry = async (fn, retries = 3, delay = 500) => {
                try {
                    return await fn();
                } catch (err) {
                    if (retries === 0) throw err;
                    // Don't retry if it's a client error (except maybe timeouts, but let's stick to status checks)
                    if (err.response && err.response.status >= 400 && err.response.status < 500) throw err;

                    await new Promise(resolve => setTimeout(resolve, delay));
                    return fetchWithRetry(fn, retries - 1, delay * 2);
                }
            };

            try {
                // If we already have the user in context, we might not need to fetch /auth/me again if context is fresh,
                // but fetching ensures we have the latest profile relation.
                // Using fetchWithRetry for robust loading
                const [meRes, subRes] = await Promise.all([
                    fetchWithRetry(() => api.get('/auth/me')),
                    fetchWithRetry(() => api.get('/subscriptions/status').catch(() => ({ data: null })))
                ]);

                if (meRes.data.role !== 'STYLIST') {
                    navigate('/'); // Safety redirect
                    return;
                }

                setUser(meRes.data);
                setProfile(meRes.data.stylistProfile);
                setSubscription(subRes.data);
            } catch (err) {
                console.error("Dashboard Load Error", err);
                // Auth Guard Logic: Only redirects if strictly unauthorized
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    logout(); // Clear potentially stale state
                    navigate('/login');
                } else {
                    // Stay on page but show error state (don't kick user out for 500s)
                    console.error("Dashboard Sync Failed:", err);
                    alert("We couldn't sync your dashboard. Please check your connection and refresh.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [navigate, authUser, authLoading]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading Studio...</div>;

    // Derived Data
    const getProLevelLabel = (key) => {
        if (!key) return 'Pro'; // Default
        if (key === 'elite') return 'Pro Elite';
        if (key === 'premier') return 'Pro Premier';
        return 'Pro';
    };
    const proLevel = getProLevelLabel(subscription?.planKey);
    const businessName = profile?.businessName || "My Beauty Business";
    const avatarUrl = profile?.profileImage;

    const handleProfileUpdate = (updatedProfile) => {
        setProfile(updatedProfile);
        // Also update user state to keep them in sync
        if (user) {
            setUser({ ...user, stylistProfile: updatedProfile });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">

            {/* 1. HERO SECTION */}
            <Hero
                pageKey="dashboard"
                desktopImageUrl={profile?.bannerImage}
                className="h-[40vh] min-h-[300px] flex items-center justify-center relative"
                overlayOpacity={0.7}
            >
                <div className="text-center text-white z-10 px-4">
                    <h1 className="font-serif text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg text-white">Pro Studio</h1>
                    <p className="text-white/80 text-lg font-medium text-white">Manage your services, bookings, and brand</p>
                </div>
            </Hero>

            {/* 2. MAIN CONTENT (Negative Margin) */}
            <div className="container mx-auto px-4 max-w-5xl relative z-20 -mt-24 mb-20">

                {/* 3. PRO PROFILE CARD */}
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-8 flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 animate-fade-in-up transition-colors duration-300">

                    {/* Avatar */}
                    <div className="relative group cursor-pointer" onClick={() => setActiveView('profile')}>
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Pro" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-4xl font-serif text-crown-dark font-bold">
                                    {businessName[0]}
                                </div>
                            )}
                        </div>
                        {/* Edit Overlay Hint */}
                        <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">
                            Edit
                        </div>
                    </div>

                    {/* Pro Details */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                            <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight">
                                {businessName}
                            </h2>
                            {/* Pro Level Badge */}
                            <span className="px-3 py-1 bg-crown-dark text-crown-gold text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm border border-crown-gold/30">
                                {proLevel}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm mb-4">
                            <span className="flex items-center gap-1">
                                <FaMapMarkerAlt /> {profile?.locationType === 'MOBILE' ? 'Mobile Service' : 'Detroit, MI'}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                <FaCheckCircle /> Accepting Bookings
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 min-w-[140px]">
                        <button
                            onClick={handleLogout}
                            className="bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {/* 4. DASHBOARD VS EDITOR VIEWS */}
                {activeView === 'home' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">






                        {/* Bookings Card (High Priority) */}
                        <DashboardCard
                            title="Bookings"
                            desc="Manage appointments & requests"
                            icon={<FaCalendarCheck className="w-6 h-6 text-white" />}
                            color="bg-crown-gold"
                            onClick={() => { setActiveView('bookings'); markBookingsSeen(); }}
                            badge={counts.pendingRequests + counts.unreadMessages}
                        />

                        {/* Services Card */}
                        <DashboardCard
                            title="Services"
                            desc="Edit menu, pricing & duration"
                            icon={<FaCut className="w-6 h-6 text-white" />}
                            color="bg-crown-dark"
                            onClick={() => setActiveView('services')}
                        />

                        {/* Profile Card */}
                        <DashboardCard
                            title="Profile & Brand"
                            desc="Update bio, photos & contact info"
                            icon={<FaStore className="w-6 h-6 text-white" />}
                            color="bg-purple-600"
                            onClick={() => setActiveView('profile')}
                        />

                        {/* Portfolio Card */}
                        <DashboardCard
                            title="Portfolio"
                            desc="Upload photos of your best work"
                            icon={<FaCamera className="w-6 h-6 text-white" />}
                            color="bg-pink-500"
                            onClick={() => setActiveView('portfolio')}
                        />

                        {/* Billing Card */}
                        <DashboardCard
                            title="Billing & Plan"
                            desc="Subscription status & payouts"
                            icon={<FaCreditCard className="w-6 h-6 text-white" />}
                            color="bg-blue-600"
                            onClick={() => setActiveView('billing')}
                        />

                    </div>
                ) : (
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden animate-fade-in transition-colors duration-300">
                        {/* Editor Header */}
                        <div className="bg-[var(--bg-tertiary)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between transition-colors duration-300">
                            <button
                                onClick={() => setActiveView('home')}
                                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-crown-dark transition"
                            >
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <h3 className="font-serif font-bold text-lg capitalize">{activeView} Editor</h3>
                        </div>

                        {/* Editor Content */}
                        <div className="p-0">
                            {activeView === 'profile' && <ProfileEditor onUpdate={handleProfileUpdate} />}
                            {activeView === 'services' && <ServiceEditor />}
                            {activeView === 'portfolio' && <PortfolioManager />}
                            {activeView === 'bookings' && <BookingManager />}
                            {activeView === 'billing' && <BillingManager />}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

// Helper Component for Dashboard Cards
function DashboardCard({ title, desc, icon, color, onClick, badge }) {
    return (
        <button
            onClick={onClick}
            className="group bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--card-border)] shadow-sm hover:shadow-md hover:border-crown-gold/30 transition-all text-left flex items-start gap-4"
        >
            <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 relative`}>
                {icon}
                {badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--card-bg)] shadow-sm">
                        {badge}
                    </span>
                )}
            </div>
            <div>
                <h3 className="font-serif font-bold text-lg text-gray-900 group-hover:text-crown-gold transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-tight mt-1">{desc}</p>
            </div>
        </button>
    );
}

// ... imports
import ChatInterface from '../components/ChatInterface';
import { MessageSquare } from 'lucide-react';

import CancellationModal from '../components/CancellationModal'; // Import CancellationModal

function BookingManager() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null); // { bookingId, otherName, bookingDate }
    const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
    const [reasonModal, setReasonModal] = useState({ open: false, text: '' });

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            setBookings(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/bookings/${id}/status`, { status });
            fetchBookings();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleCancelBooking = async (reason) => {
        try {
            await api.put(`/bookings/${cancelModal.bookingId}/cancel`, { reason });
            setCancelModal({ open: false, bookingId: null });
            fetchBookings();
        } catch (err) {
            alert('Failed to cancel booking');
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!confirm('Are you sure you want to delete this booking request? This cannot be undone.')) return;
        try {
            await api.delete(`/bookings/${id}`);
            fetchBookings();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to delete booking');
        }
    };

    const openChat = (booking) => {
        setActiveChat({
            bookingId: booking.id,
            otherName: booking.client.displayName || 'Client',
            bookingDate: booking.appointmentDate,
            status: booking.status
        });
    };

    if (isLoading) return <div>Loading...</div>;

    const CancelBadge = () => <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs ml-2">CANCELLED</span>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-serif mb-6">Booking Requests</h2>

            <CancellationModal
                isOpen={cancelModal.open}
                onClose={() => setCancelModal({ open: false, bookingId: null })}
                onConfirm={handleCancelBooking}
                title="Cancel Appointment"
            />

            {activeChat && (
                <ChatInterface
                    bookingId={activeChat.bookingId}
                    participants={activeChat}
                    onClose={() => {
                        setActiveChat(null);
                        fetchBookings(); // Refresh list to clear dots
                    }}
                />
            )}

            <div className="space-y-4">
                {bookings.length === 0 && <p className="text-gray-500">No booking requests found.</p>}
                {bookings.map(booking => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:border-crown-gold transition">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-lg">{booking.service.name}</h4>
                                <p className="text-gray-600">
                                    Client: {booking.client.displayName || booking.client.email}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                booking.status.includes('CANCEL') ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {booking.status === 'CANCELLED_BY_CLIENT' ? 'CLIENT CANCELLED' :
                                    booking.status === 'CANCELLED_BY_TECH' ? 'CANCELED' :
                                        booking.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-crown-gray">
                                {new Date(booking.appointmentDate).toLocaleString()} • ${booking.service.price}
                            </p>

                            <div className="flex gap-2">
                                {/* Message Button */}
                                {booking.status !== 'PENDING' && !booking.status.includes('CANCEL') && (
                                    <>
                                        <button
                                            onClick={() => setCancelModal({ open: true, bookingId: booking.id })}
                                            className="text-red-500 hover:bg-red-50 px-3 py-1 rounded transition text-xs font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => openChat(booking)}
                                            className="text-crown-gold hover:bg-crown-gold/10 p-2 rounded-full transition flex items-center gap-1 relative"
                                            title="Message Client"
                                        >
                                            <MessageSquare size={18} />
                                            {/* Notification Dot */}
                                            {booking.conversation?._count?.messages > 0 && (
                                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                            )}
                                        </button>
                                    </>
                                )}

                                {/* Buttons for Cancelled/Generic Status */}
                                {booking.status.includes('CANCEL') && (
                                    <>
                                        <button
                                            onClick={() => setReasonModal({ open: true, text: booking.cancellationReason })}
                                            className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition flex items-center gap-1 relative"
                                            title="View Cancellation Reason"
                                        >
                                            <FaInfoCircle size={18} />
                                        </button>

                                        <button
                                            onClick={() => openChat(booking)}
                                            className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition flex items-center gap-1 relative"
                                            title="View Messages"
                                        >
                                            <MessageSquare size={18} />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteBooking(booking.id)}
                                            className="text-red-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition flex items-center gap-1 relative"
                                            title="Delete Request"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </>
                                )}

                                {booking.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setCancelModal({ open: true, bookingId: booking.id })}
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reason View Modal */}
            {reasonModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
                        <button
                            onClick={() => setReasonModal({ open: false, text: '' })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes />
                        </button>
                        <h3 className="font-serif font-bold text-xl mb-4 text-gray-900">Cancellation Reason</h3>
                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700 italic border border-gray-100 min-h-[80px]">
                            "{reasonModal.text || 'No reason provided.'}"
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setReasonModal({ open: false, text: '' })}
                                className="btn-secondary py-2 px-6"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileEditor({ onUpdate }) {
    const [profile, setProfile] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Assuming we have an endpoint for this, or we just rely on /auth/me for now
                // Wait, we need a way to get the *stylist* profile.
                // Let's use getMe to get the stylistProfile relation
                const res = await api.get('/auth/me');
                if (res.data.stylistProfile) {
                    setProfile(res.data.stylistProfile);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const updateSpecialty = (spec) => {
        const current = profile.specialties || [];
        const newSpecialties = current.includes(spec)
            ? current.filter(s => s !== spec)
            : [...current, spec];
        setProfile({ ...profile, specialties: newSpecialties });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/stylists/me', profile);
            setProfile(res.data);
            if (onUpdate) onUpdate(res.data);
            alert('Profile updated!');
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const endpoint = type === 'profile'
                ? '/stylists/upload-profile-image'
                : '/stylists/upload-banner-image';

            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfile(res.data.profile);
            if (onUpdate) onUpdate(res.data.profile);
            alert(`${type === 'profile' ? 'Profile' : 'Banner'} image updated!`);
        } catch (err) {
            console.error(err);
            alert('Failed to upload image');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-serif mb-6">Edit Profile</h2>

            {/* Image Uploads */}
            <div className="mb-8 grid md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-bold mb-2">Profile Photo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                            )}
                        </div>
                        <label className="btn-secondary py-2 px-4 text-sm cursor-pointer">
                            Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Banner Image</label>
                    <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative">
                        {profile.bannerImage ? (
                            <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Banner</div>
                        )}
                    </div>
                    <label className="btn-secondary py-2 px-4 text-sm cursor-pointer mt-2 inline-block">
                        Upload Banner
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                    </label>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold mb-2">Business Name</label>
                    <input
                        name="businessName"
                        type="text"
                        className="w-full p-2 border rounded-lg"
                        value={profile.businessName || ''}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Bio</label>
                    <textarea
                        name="bio"
                        className="w-full p-2 border rounded-lg h-32"
                        value={profile.bio || ''}
                        onChange={handleChange}
                    ></textarea>
                </div>

                {/* Contact Information */}
                <div>
                    <h3 className="font-bold text-lg mb-4 mt-6 border-b pb-2">Client Contact Methods</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Phone Number</label>
                            <input
                                name="phoneNumber"
                                type="text"
                                placeholder="(555) 555-5555"
                                className="w-full p-2 border rounded-lg"
                                value={profile.phoneNumber || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Website</label>
                            <input
                                name="websiteUrl"
                                type="url"
                                placeholder="https://..."
                                className="w-full p-2 border rounded-lg"
                                value={profile.websiteUrl || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Instagram Handle</label>
                            <div className="flex">
                                <span className="p-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500">@</span>
                                <input
                                    name="instagramHandle"
                                    type="text"
                                    placeholder="username"
                                    className="w-full p-2 border rounded-r-lg"
                                    value={profile.instagramHandle || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">TikTok Handle</label>
                            <div className="flex">
                                <span className="p-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500">@</span>
                                <input
                                    name="tiktokHandle"
                                    type="text"
                                    placeholder="username"
                                    className="w-full p-2 border rounded-r-lg"
                                    value={profile.tiktokHandle || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2">Contact Preference (Public visibility)</label>
                        <select
                            name="contactPreference"
                            className="w-full p-2 border rounded-lg"
                            value={profile.contactPreference || 'BOOKINGS_ONLY'}
                            onChange={handleChange}
                        >
                            <option value="BOOKINGS_ONLY">Bookings Only (Hide contact info)</option>
                            <option value="CALL_OR_TEXT">Allow Calls/Text (Shows Phone)</option>
                            <option value="SOCIAL_DM">Social Basics (Shows Insta/TikTok/Web)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Controls which contact buttons appear on your public profile.
                        </p>
                    </div>
                </div>

                {/* Add Location Type */}\
                <div>
                    <label className="block text-sm font-bold mb-2">Location Type</label>
                    <select
                        name="locationType"
                        className="w-full p-2 border rounded-lg"
                        value={profile.locationType || 'HOME'}
                        onChange={handleChange}
                    >
                        <option value="HOME">Home-based</option>
                        <option value="SALON">Salon Suite</option>
                        <option value="MOBILE">Mobile</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">My Specialties</label>
                    <div className="flex flex-wrap gap-4">
                        {SERVICE_CATEGORIES.map((cat) => (
                            <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.specialties?.includes(cat.id)}
                                    onChange={() => updateSpecialty(cat.id)}
                                    className="rounded border-gray-300 text-crown-gold focus:ring-crown-gold"
                                />
                                <span>{cat.shortLabel}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button className="btn-primary">Save Changes</button>
            </form>
        </div>
    );
}

function ServiceEditor() {
    const [services, setServices] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New Service State
    const [newService, setNewService] = useState({ name: '', price: '', duration: '', deposit: '', category: 'hair' });

    const fetchServices = async () => {
        try {
            const me = await api.get('/auth/me');
            if (me.data.stylistProfile) {
                const stylistId = me.data.stylistProfile.id;
                const res = await api.get(`/stylists/${stylistId}`);
                setServices(res.data.services || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/services', newService);
            setNewService({ name: '', price: '', duration: '', deposit: '', category: 'hair' });
            setIsCreating(false);
            fetchServices();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This will remove the service from your storefront.")) return;
        try {
            await api.delete(`/services/${id}`);
            fetchServices();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Service Menu</h2>
                    <p className="text-gray-500 text-sm mt-1 max-w-md">
                        Manage the services visible on your storefront. Adding services helps clients find you in search.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary bg-crown-dark text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-black transition shadow-md"
                    disabled={isCreating}
                >
                    <span className="text-xl leading-none font-light">+</span> Add Service
                </button>
            </div>

            {isCreating && (
                <div className="mb-8 p-6 bg-gray-50/80 rounded-2xl border border-gray-200 shadow-inner animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-lg text-gray-800">Add New Service</h4>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="text-gray-400 hover:text-gray-600 p-2"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                            {/* Category Select */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Service Category</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-3 pl-4 border border-gray-300 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-crown-gold focus:border-transparent transition"
                                        value={newService.category}
                                        onChange={e => setNewService({ ...newService, category: e.target.value })}
                                        required
                                    >
                                        {SERVICE_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Categorizing your services correctly ensures they appear in the right search filters.
                                </p>
                            </div>

                            {/* Service Name */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Service Name</label>
                                <input
                                    placeholder="e.g. Silk Press & Trim"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none transition"
                                    required
                                    value={newService.name}
                                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                                />
                            </div>

                            {/* Details Row */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                                <input
                                    placeholder="0.00"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none transition"
                                    required
                                    value={newService.price}
                                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Duration (min)</label>
                                <input
                                    placeholder="e.g. 60"
                                    type="number"
                                    min="5"
                                    step="5"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none transition"
                                    required
                                    value={newService.duration}
                                    onChange={e => setNewService({ ...newService, duration: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Required Deposit ($) <span className="font-normal text-gray-400">- Optional</span></label>
                                <input
                                    placeholder="0.00"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none transition"
                                    value={newService.deposit}
                                    onChange={e => setNewService({ ...newService, deposit: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Enter the deposit amount you require. You are responsible for collecting this directly from clients (e.g., via Zelle, CashApp). CrownSide does not process deposits.
                                </p>
                            </div>

                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 btn-primary bg-crown-dark text-white px-6 py-3 rounded-xl hover:bg-black transition shadow-md font-bold"
                            >
                                {submitting ? 'Saving...' : 'Save Service'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {services.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-4">
                            <FaCut size={48} className="mx-auto opacity-20" />
                        </div>
                        <p className="text-gray-500 font-medium">No services added yet.</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first service to start accepting bookings.</p>
                        <button onClick={() => setIsCreating(true)} className="mt-6 text-crown-gold font-bold hover:underline">
                            + Add Service
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {services.map(s => {
                            const category = SERVICE_CATEGORIES.find(c => c.id === s.category);
                            return (
                                <div key={s.id} className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-crown-gold/30 transition flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-crown-gold/10 group-hover:text-crown-gold transition">
                                            {category ? <category.icon size={20} /> : <FaCut />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-crown-dark transition">{s.name}</h4>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                                                    {category ? category.shortLabel : s.category}
                                                </span>
                                                <span>•</span>
                                                <span>{s.duration} min</span>
                                                <span>•</span>
                                                <span className="font-medium text-gray-900">${s.price}</span>
                                                {s.deposit > 0 && <span className="text-xs text-crown-gold">• ${s.deposit} Dep.</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                                        title="Delete Service"
                                    >
                                        <span className="text-xl leading-none">×</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function BillingManager() {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/subscriptions/status');
            setSubscription(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features immediately (or at end of period).')) return;
        try {
            await api.post('/subscriptions/cancel');
            alert('Subscription canceled.');
            fetchSubscription();
        } catch (err) {
            alert('Failed to cancel');
        }
    };

    if (loading) return <div>Loading...</div>;

    if (!subscription || subscription.status === 'NO_SUBSCRIPTION') {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                <h2 className="text-2xl font-serif mb-4">No Active Subscription</h2>
                <p className="text-gray-600 mb-6">You are not currently subscribed to any plan.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/register?step=plan'}>View Plans</button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-serif mb-6">Billing & Subscription</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 flex gap-3">
                <span className="text-xl">🤝</span>
                <div>
                    <p className="font-bold text-gray-800">Your Earnings are Yours.</p>
                    <p>We do not take commissions on your appointments or services. This subscription covers your platform hosting and features.</p>
                </div>
            </div>

            <div className="bg-gray-50 border border-crown-soft rounded-xl p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-crown-dark mb-1">
                            {subscription.plan?.name || 'Unknown Plan'}
                        </h3>
                        <p className="text-crown-gold font-medium text-lg">${subscription.plan?.price}/month</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${subscription.status === 'ACTIVE' || subscription.status === 'TRIAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {subscription.status === 'TRIAL' ? 'EARLY ACCESS' : subscription.status}
                    </span>
                </div>

                {subscription.status === 'TRIAL' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-800 rounded-lg text-sm flex items-start gap-3">
                        <span className="text-xl">🎁</span>
                        <div>
                            <p className="font-bold">You have Early Access!</p>
                            <p className="mt-1">Your free trial ends on <span className="font-bold">{new Date(subscription.trialEndsAt).toLocaleDateString()}</span>. You won't be charged until then.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t pt-6">
                <h4 className="font-bold mb-4">Actions</h4>
                <div className="flex gap-4">
                    {/* Placeholder for Update Payment Method */}
                    <button className="text-gray-600 hover:text-black font-medium underline">
                        Update Payment Method
                    </button>

                    {subscription.status !== 'CANCELED' && (
                        <button onClick={handleCancel} className="text-red-500 hover:text-red-700 font-medium underline">
                            Cancel Subscription
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
