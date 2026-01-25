import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
    FaUserPlus, FaUserCheck, FaUserTimes, FaComment, FaEllipsisH, FaBan, FaFlag, FaArrowLeft, FaStar, FaUsers
} from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfile() {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const locationHook = useLocation();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('NONE'); // NONE, REQUEST_SENT, REQUEST_RECEIVED, CONNECTED
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.id === userId) {
            navigate('/profile'); // Redirect to own edit profile
            return;
        }
        fetchProfile();
    }, [userId, currentUser]);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/users/${userId}/public`);
            setProfile(res.data);
            setConnectionStatus(res.data.connectionStatus);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404 || err.response?.status === 403) {
                // Blocked or Not Found
                setProfile(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        setActionLoading(true);
        try {
            await api.post('/connections/request', { targetUserId: userId });
            setConnectionStatus('REQUEST_SENT');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            await api.post('/connections/accept', { requesterId: userId });
            setConnectionStatus('CONNECTED');
        } catch (err) {
            alert('Failed to accept');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm('Are you sure you want to remove this connection?')) return;
        setActionLoading(true);
        try {
            await api.post('/connections/remove', { targetUserId: userId });
            setConnectionStatus('NONE');
        } catch (err) {
            alert('Failed to remove');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMessage = async () => {
        try {
            const res = await api.post('/messages', { participantId: userId });
            navigate(`/messages/${res.data.id}`);
        } catch (err) {
            alert('Failed to open chat');
        }
    };

    const handleBlock = async () => {
        if (!window.confirm('Block this user? You will no longer see them or their content.')) return;
        try {
            await api.post('/blocks', { targetUserId: userId });
            navigate('/forum/feed');
        } catch (err) {
            alert('Failed to block');
        }
    };

    if (isLoading) return <div className="text-center py-20 animate-pulse text-gray-400">Loading Profile...</div>;
    if (!profile) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
            <p className="text-gray-500">This profile is not available.</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-crown-gold hover:underline">Go Back</button>
        </div>
    );

    const isConnected = connectionStatus === 'CONNECTED';

    return (
        <div className="min-h-screen bg-neutral-50 pb-20 font-sans">

            {/* 1. Header / Hero Area */}
            <div className="h-48 md:h-64 relative overflow-hidden bg-neutral-900">
                {/* Abstract Neutral Header */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485230946086-1d99d529a763?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Navbar Placeholders / Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-30 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition shadow-lg"
                >
                    <FaArrowLeft size={16} />
                </button>
            </div>

            {/* 2. Client Identity Card (Floating) */}
            <div className="container mx-auto px-4 -mt-12 relative z-10 flex flex-col items-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 animate-enter">

                    {/* Identity Content */}
                    <div className="pt-12 px-6 pb-6 flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-3 -mt-16 relative z-20">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-crown-cream flex items-center justify-center text-3xl font-serif text-crown-dark font-bold">
                                    {(profile.displayName || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Name & Label */}
                        <h1 className="text-2xl font-serif font-bold text-gray-900">{profile.displayName}</h1>
                        <span className="text-xs uppercase tracking-widest text-crown-gold font-bold mt-1">CrownSide Client</span>

                        {profile.location && (
                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                📍 {profile.location}
                            </p>
                        )}

                        {/* Chips / Stats - "Friends List" Style */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-100">
                                <FaUsers className="text-gray-400" />
                                <span>{profile.connectionCount} Connection{profile.connectionCount !== 1 ? 's' : ''}</span>
                            </div>
                            {/* Verified / Active Chips if we had data (mocking for design completeness as per request "Add trust chips") */}
                            <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                                Member
                            </div>
                        </div>

                        {/* 3. Connection Context */}
                        <div className="mt-4 text-xs text-gray-400">
                            {!currentUser ? (
                                <span>Connected with other CrownSide members</span>
                            ) : (
                                <span>
                                    {isConnected ? 'You are connected' : 'Connect to see full activity'}
                                </span>
                            )}
                        </div>

                        {/* 4. Action Strip */}
                        <div className="mt-6 w-full flex flex-col gap-3">
                            {!currentUser ? (
                                <>
                                    <button
                                        onClick={() => navigate('/login', { state: { from: locationHook.pathname } })}
                                        className="w-full py-2.5 bg-crown-dark text-white rounded-xl font-medium text-sm hover:bg-black transition shadow-md"
                                    >
                                        Log in to Connect
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 w-full">
                                    {connectionStatus === 'NONE' && (
                                        <button onClick={handleConnect} disabled={actionLoading} className="flex-1 btn-primary py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                                            <FaUserPlus /> Connect
                                        </button>
                                    )}
                                    {connectionStatus === 'REQUEST_SENT' && (
                                        <button onClick={handleRemove} disabled={actionLoading} className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-gray-200">
                                            <FaUserTimes /> Requested
                                        </button>
                                    )}
                                    {connectionStatus === 'REQUEST_RECEIVED' && (
                                        <button onClick={handleAccept} disabled={actionLoading} className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-green-600 shadow-md">
                                            <FaUserCheck /> Accept
                                        </button>
                                    )}
                                    {connectionStatus === 'CONNECTED' && (
                                        <>
                                            <button disabled className="flex-1 bg-green-50 text-green-700 border border-green-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm cursor-default">
                                                <FaUserCheck /> Friends
                                            </button>
                                            <button onClick={handleMessage} className="flex-1 bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-blue-600 shadow-md">
                                                <FaComment /> Message
                                            </button>
                                        </>
                                    )}

                                    {/* Overflow Menu */}
                                    <Menu as="div" className="relative">
                                        <Menu.Button className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition">
                                            <FaEllipsisH />
                                        </Menu.Button>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 origin-bottom-right bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 text-left overflow-hidden">
                                                <div className="py-1">
                                                    {connectionStatus === 'CONNECTED' && (
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button onClick={handleRemove} className={`${active ? 'bg-gray-50' : ''} text-gray-700 w-full px-4 py-2.5 text-sm flex items-center`}>
                                                                    <FaUserTimes className="mr-3 text-gray-400" /> Remove Connection
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    )}
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button onClick={handleBlock} className={`${active ? 'bg-red-50' : ''} text-red-600 w-full px-4 py-2.5 text-sm flex items-center`}>
                                                                <FaBan className="mr-3" /> Block User
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* 5. Activity & Connections Preview */}
                    <div className="border-t border-gray-100 bg-gray-50/50 p-6">

                        {/* Recent Reviews (Activity) */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                                <span>Recent Activity</span>
                                {/* Lock icon if not logged in? */}
                            </h3>

                            <div className={`space-y-3 ${!currentUser ? 'blur-[2px] opacity-60 select-none pointer-events-none' : ''}`}>
                                {profile.recentReviews && profile.recentReviews.length > 0 ? (
                                    profile.recentReviews.map(review => (
                                        <div key={review.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-crown-gold/10 flex items-center justify-center flex-shrink-0 text-crown-gold">
                                                <FaStar size={12} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800">
                                                    Reviewed <span className="font-semibold">{review.stylistName}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {/* Truncate comment */}
                                                    "{review.comment.substring(0, 40)}{review.comment.length > 40 ? '...' : ''}"
                                                </p>
                                                <span className="text-[10px] text-gray-400 mt-1 block">{formatDistanceToNow(new Date(review.createdAt))} ago</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No recent activity visible.</p>
                                )}
                            </div>

                            {!currentUser && (
                                <div className="text-center mt-2">
                                    <span className="text-xs font-semibold text-crown-gold cursor-pointer" onClick={() => navigate('/login')}>Log in to view full activity</span>
                                </div>
                            )}
                        </div>

                        {/* Recent Connections */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Connections</h3>
                            <div className={`flex items-center gap-2 ${!currentUser ? 'filter blur-sm select-none' : ''}`}>
                                {profile.recentConnections && profile.recentConnections.length > 0 ? (
                                    profile.recentConnections.map(conn => (
                                        <div key={conn.id} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-200" title={conn.displayName}>
                                            <img src={conn.profileImage || `https://placehold.co/100?text=${(conn.displayName || '?')[0]}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400">No public connections yet.</span>
                                )}
                                {profile.connectionCount > 4 && (
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                        +{profile.connectionCount - 4}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* 7. Micro-Copy Trust Signal */}
                    <div className="bg-gray-100 p-3 text-center border-t border-gray-200">
                        <p className="text-[10px] text-gray-500 font-medium">
                            Client profiles help build trust between members and professionals.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
