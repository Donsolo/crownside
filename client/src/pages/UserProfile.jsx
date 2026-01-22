import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
    FaUserPlus, FaUserCheck, FaUserTimes, FaComment, FaEllipsisH, FaBan, FaFlag, FaArrowLeft
} from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Hero from '../components/Hero';

export default function UserProfile() {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

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
            // Get or Create Conversation
            const res = await api.post('/messages', { participantId: userId });
            // Navigate to Booking/Chat View? Or we need a standalone Chat Page.
            // Current ChatInterface is embedded in bookings. We need a general 'Messages' page or similar.
            // For now, let's assume we have a way to view generic chats. 
            // Reuse BookingChat logic but maybe without booking context?
            // Let's navigate to /messages/:conversationId (Need to create this route/page)
            navigate(`/messages/${res.data.id}`);
        } catch (err) {
            alert('Failed to open chat');
        }
    };

    const handleBlock = async () => {
        if (!window.confirm('Block this user? You will no longer see them or their content.')) return;
        try {
            await api.post('/blocks', { targetUserId: userId });
            navigate('/forum/feed'); // Redirect away
        } catch (err) {
            alert('Failed to block');
        }
    };

    if (isLoading) return <div className="text-center py-20">Loading Profile...</div>;
    if (!profile) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
            <p className="text-gray-500">This profile is not available.</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-crown-gold hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            <Hero pageKey="profile" className="h-[30vh] min-h-[250px] relative flex items-center justify-center">
                <div className="text-center text-white z-10 px-4">
                    <h1 className="font-serif text-3xl font-bold mb-2">Crown Connect</h1>
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-30 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition shadow-lg"
                >
                    <FaArrowLeft size={16} />
                </button>
            </Hero>

            <div className="container mx-auto px-4 relative z-20 -mt-16">
                <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center text-center gap-6">

                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-4xl font-serif text-crown-dark font-bold">
                                    {(profile.displayName || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-gray-900">{profile.displayName}</h2>
                        <div className="flex justify-center gap-2 mt-2 text-sm text-gray-500">
                            {profile.location && <span>📍 {profile.location}</span>}
                            {profile.location && <span>•</span>}
                            <span>{profile.connectionCount} Connection{profile.connectionCount !== 1 ? 's' : ''}</span>
                        </div>
                        {profile.bio && <p className="text-gray-600 mt-4 max-w-sm mx-auto">{profile.bio}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full justify-center">
                        {/* Connection Button Logic */}
                        {connectionStatus === 'NONE' && (
                            <button onClick={handleConnect} disabled={actionLoading} className="btn-primary py-2 px-6 flex items-center gap-2 text-sm">
                                <FaUserPlus /> Connect
                            </button>
                        )}
                        {connectionStatus === 'REQUEST_SENT' && (
                            <button onClick={handleRemove} disabled={actionLoading} className="bg-gray-100 text-gray-600 font-bold py-2 px-6 rounded-full flex items-center gap-2 text-sm hover:bg-gray-200">
                                <FaUserTimes /> Requested
                            </button>
                        )}
                        {connectionStatus === 'REQUEST_RECEIVED' && (
                            <button onClick={handleAccept} disabled={actionLoading} className="bg-green-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 text-sm hover:bg-green-600 shadow-md">
                                <FaUserCheck /> Accept
                            </button>
                        )}
                        {connectionStatus === 'CONNECTED' && (
                            <>
                                <button className="bg-green-50 text-green-700 border border-green-200 font-bold py-2 px-4 rounded-full flex items-center gap-2 text-sm cursor-default">
                                    <FaUserCheck /> Friends
                                </button>
                                <button onClick={handleMessage} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 text-sm hover:bg-blue-600 shadow-md">
                                    <FaComment /> Message
                                </button>
                            </>
                        )}

                        {/* Menu (Block/Report) */}
                        <Menu as="div" className="relative ml-2">
                            <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
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
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="py-1">
                                        {connectionStatus === 'CONNECTED' && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={handleRemove}
                                                        className={`${active ? 'bg-gray-100' : ''} text-gray-700 group flex w-full items-center px-4 py-2 text-sm`}
                                                    >
                                                        <FaUserTimes className="mr-3 text-gray-400" /> Remove Connection
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => alert('Report feature coming soon')} // Or trigger modal
                                                    className={`${active ? 'bg-gray-100' : ''} text-gray-700 group flex w-full items-center px-4 py-2 text-sm`}
                                                >
                                                    <FaFlag className="mr-3 text-gray-400" /> Report User
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleBlock}
                                                    className={`${active ? 'bg-red-50' : ''} text-red-600 group flex w-full items-center px-4 py-2 text-sm`}
                                                >
                                                    <FaBan className="mr-3 text-red-400" /> Block User
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>

                </div>
            </div>
        </div>
    );
}
