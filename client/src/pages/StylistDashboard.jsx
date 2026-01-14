import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PortfolioManager from '../components/PortfolioManager';

export default function StylistDashboard() {
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const updateSpecialty = async (spec) => {
        // This is a placeholder for the local state update. 
        // In a real app, this should likely interact with the profile state directly or via API.
        // Since the profile state is deeply nested in ProfileEditor, we might need to move this or pass it down.
        // However, ProfileEditor has its own local `profile` state.
        // Let's rely on ProfileEditor's internal logic which I previously modified to use `updateSpecialty` name in the render, 
        // but that render is *inside* ProfileEditor component.
        // Wait, the `updateSpecialty` call in my previous replacement was inside `ProfileEditor`.
        // So I don't need it here in the main component. I need it inside `ProfileEditor`.
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || user.role !== 'STYLIST') {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Subscription Warning */}
            {activeTab !== 'profile' && (
                <div className="hidden md:block">
                    {/* We need to fetch/know the status. For now assuming active unless login returns otherwise. 
                         In a real app, useAuth would give us the full user object with profile.
                     */}
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-serif text-crown-dark">Professional Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="md:hidden text-sm bg-crown-gray text-white px-4 py-2 rounded-lg"
                >
                    Log Out
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <div className="w-full md:w-1/4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-6 py-4 font-medium transition ${activeTab === 'profile' ? 'bg-crown-gold text-white' : 'hover:bg-gray-50'}`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`w-full text-left px-6 py-4 font-medium transition ${activeTab === 'services' ? 'bg-crown-gold text-white' : 'hover:bg-gray-50'}`}
                        >
                            Services
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`w-full text-left px-6 py-4 font-medium transition ${activeTab === 'portfolio' ? 'bg-crown-gold text-white' : 'hover:bg-gray-50'}`}
                        >
                            Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`w-full text-left px-6 py-4 font-medium transition ${activeTab === 'bookings' ? 'bg-crown-gold text-white' : 'hover:bg-gray-50'}`}
                        >
                            Bookings
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`w-full text-left px-6 py-4 font-medium transition ${activeTab === 'billing' ? 'bg-crown-gold text-white' : 'hover:bg-gray-50'}`}
                        >
                            Billing
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="w-full md:w-3/4">
                    {activeTab === 'profile' && <ProfileEditor />}
                    {activeTab === 'services' && <ServiceEditor />}
                    {activeTab === 'portfolio' && <PortfolioManager />}
                    {activeTab === 'bookings' && <BookingManager />}
                    {activeTab === 'billing' && <BillingManager />}
                </div>
            </div>
        </div >
    );
}

function BookingManager() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-serif mb-6">Booking Requests</h2>
            <div className="space-y-4">
                {bookings.length === 0 && <p className="text-gray-500">No booking requests found.</p>}
                {bookings.map(booking => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:border-crown-gold transition">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-lg">{booking.service.name}</h4>
                                <p className="text-gray-600">
                                    Client: {booking.client.email}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                booking.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-crown-gray">
                                {new Date(booking.appointmentDate).toLocaleString()} • ${booking.service.price}
                            </p>

                            {booking.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(booking.id, 'CANCELED')}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfileEditor() {
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
            await api.put('/stylists/me', profile);
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
                {/* Add Location Type */}
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
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.specialties?.includes('hair')}
                                onChange={() => updateSpecialty('hair')}
                                className="rounded border-gray-300 text-crown-gold focus:ring-crown-gold"
                            />
                            <span>Hair</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.specialties?.includes('nails')}
                                onChange={() => updateSpecialty('nails')}
                                className="rounded border-gray-300 text-crown-gold focus:ring-crown-gold"
                            />
                            <span>Nails</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.specialties?.includes('lash_brow')}
                                onChange={() => updateSpecialty('lash_brow')}
                                className="rounded border-gray-300 text-crown-gold focus:ring-crown-gold"
                            />
                            <span>Lash/Brow Tech</span>
                        </label>
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

    // New Service State
    const [newService, setNewService] = useState({ name: '', price: '', duration: '', deposit: '', category: '' });
    const [specialties, setSpecialties] = useState([]);

    const fetchProfileAndServices = async () => {
        try {
            const me = await api.get('/auth/me');
            if (me.data.stylistProfile) {
                const profile = me.data.stylistProfile;
                const stylistId = profile.id;
                const userSpecialties = profile.specialties || ['hair']; // Fallback
                setSpecialties(userSpecialties);

                // Set default allowed category
                if (userSpecialties.length > 0) {
                    setNewService(prev => ({ ...prev, category: userSpecialties[0] }));
                }

                const res = await api.get(`/stylists/${stylistId}`);
                setServices(res.data.services || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProfileAndServices();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/services', newService);
            setNewService({ name: '', price: '', duration: '', deposit: '', category: specialties[0] || 'hair' });
            setIsCreating(false);
            fetchProfileAndServices();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create service');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/services/${id}`);
            fetchProfileAndServices();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif">My Services</h2>
                <button onClick={() => setIsCreating(!isCreating)} className="btn-secondary py-2 px-4 text-sm">
                    {isCreating ? 'Cancel' : 'Add New Service'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold mb-3">New Service details</h4>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-1">Category</label>
                        <select
                            className="p-2 border rounded w-full md:w-1/2"
                            value={newService.category}
                            onChange={e => setNewService({ ...newService, category: e.target.value })}
                        >
                            {specialties.includes('hair') && <option value="hair">Hair</option>}
                            {specialties.includes('nails') && <option value="nails">Nails</option>}
                            {specialties.includes('lash_brow') && <option value="lash_brow">Lash/Brow Tech</option>}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Available categories based on your subscription.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input placeholder="Service Name" className="p-2 border rounded" required value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
                        <input placeholder="Price ($)" type="number" className="p-2 border rounded" required value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
                        <input placeholder="Duration (min)" type="number" className="p-2 border rounded" required value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
                        <input placeholder="Deposit ($) [Optional]" type="number" className="p-2 border rounded" value={newService.deposit} onChange={e => setNewService({ ...newService, deposit: e.target.value })} />
                    </div>
                    <button className="bg-crown-dark text-white px-4 py-2 rounded">Save Service</button>
                </form>
            )}

            <div className="space-y-4">
                {services.length === 0 && <p className="text-gray-500">No services added yet.</p>}
                {services.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 border rounded-lg hover:border-crown-gold transition">
                        <div>
                            <h4 className="font-bold text-lg">{s.name}</h4>
                            <p className="text-gray-500">{s.duration} mins • ${s.price}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </div>
                    </div>
                ))}
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

            <div className="bg-gray-50 border border-crown-soft rounded-xl p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-crown-dark mb-1">
                            {subscription.plan?.name || 'Unknown Plan'}
                        </h3>
                        <p className="text-crown-gold font-medium text-lg">${subscription.plan?.price}/month</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${subscription.status === 'ACTIVE' || subscription.status === 'TRIAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {subscription.status}
                    </span>
                </div>

                {subscription.status === 'TRIAL' && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        Trial ends on: {new Date(subscription.trialEndsAt).toLocaleDateString()}
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
