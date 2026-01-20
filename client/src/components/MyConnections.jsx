import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTimes, FaCommentAlt, FaEllipsisH, FaUserSlash, FaBan, FaFlag, FaCheck } from 'react-icons/fa';
import api from '../lib/api';
import ChatInterface from './ChatInterface';

export default function MyConnections({ onClose }) {
    const navigate = useNavigate();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null); // ID of connection with open menu
    const [activeChat, setActiveChat] = useState(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await api.get('/connections');
            setConnections(res.data);
        } catch (err) {
            console.error("Failed to fetch connections", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = (conn) => {
        createConversation(conn);
    };

    const createConversation = async (conn) => {
        try {
            const res = await api.post('/messages', { participantId: conn.id });
            // Instead of closing and navigating, open the local overlay with participant info
            setActiveChat({
                id: res.data.id,
                participants: {
                    otherName: conn.name,
                    otherImage: conn.image
                }
            });
        } catch (err) {
            console.error("Failed to open chat", err);
            alert("Unable to open chat with this user.");
        }
    };

    const navigateToProfile = (conn) => {
        if (conn.role === 'STYLIST') {
            // AUTHORITATIVE FIX: Ensure we use stylistId, never userId for Stylist Storefront
            if (conn.stylistId) {
                navigate(`/stylist/${conn.stylistId}`);
            } else {
                console.error("Critical: User is STYLIST but missing stylistId", conn);
                alert("This professional profile is not available.");
            }
        } else {
            // Client Profile uses generic userId
            navigate(`/user/${conn.id}`);
        }
        onClose();
    };

    const handleAccept = async (id) => {
        try {
            await api.post('/connections/accept', { requesterId: id });
            setConnections(prev => prev.map(c =>
                c.id === id ? { ...c, status: 'ACCEPTED', isIncoming: false } : c
            ));
        } catch (err) {
            console.error("Failed to accept", err);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("Remove this connection?")) return;
        try {
            await api.delete('/connections', { data: { targetUserId: id } });
            setConnections(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleBlock = async (id) => {
        if (!window.confirm("Block this user? You won't see them anymore.")) return;
        try {
            await api.post('/blocks', { targetUserId: id });
            setConnections(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const requests = connections.filter(c => c.isIncoming);
    const friends = connections.filter(c => !c.isIncoming);

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-enter">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                {/* Content Card */}
                <div className="bg-white w-full md:w-[480px] md:rounded-2xl h-[90vh] md:h-[80vh] flex flex-col shadow-2xl relative z-10 overflow-hidden rounded-t-2xl">

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur z-20 sticky top-0">
                        <button onClick={onClose} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition">
                            <FaArrowLeft />
                        </button>
                        <h2 className="text-lg font-serif font-bold text-gray-900">My Connections</h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                            <FaTimes />
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl text-gray-300">
                                    <FaUserSlash />
                                </div>
                                <p className="font-medium text-lg text-gray-900 mb-1">No connections yet</p>
                                <p className="text-sm mb-6">Connect with your favorite stylists and clients to keep in touch.</p>
                                <button
                                    onClick={() => { onClose(); navigate('/explore'); }}
                                    className="btn-primary py-2 px-6"
                                >
                                    Start Connecting
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Requests Section */}
                                {requests.length > 0 && (
                                    <div className="mb-6 animate-enter">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Friend Requests</h3>
                                        <div className="space-y-3">
                                            {requests.map(conn => (
                                                <div key={conn.id} className="bg-crown-gold/5 border border-crown-gold/20 rounded-xl p-3 flex items-center gap-3">
                                                    <div onClick={() => navigateToProfile(conn)} className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden cursor-pointer">
                                                        {conn.image ? (
                                                            <img src={conn.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-crown-dark text-white font-bold text-lg">
                                                                {(conn.name?.[0] || '?')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">{conn.name}</h3>
                                                        <p className="text-xs text-crown-gold font-medium uppercase tracking-wide">Wants to connect</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAccept(conn.id)}
                                                            className="px-3 py-1.5 bg-crown-gold text-white text-xs font-bold rounded-lg hover:bg-crown-dark transition shadow-sm flex items-center gap-1"
                                                        >
                                                            <FaCheck /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(conn.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-px bg-gray-100 my-4" />
                                    </div>
                                )}

                                {/* Connections Section */}
                                {friends.length > 0 && (
                                    <div className="space-y-2">
                                        {requests.length > 0 && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Your Connections</h3>}
                                        {friends.map(conn => (
                                            <div key={conn.id} className="group relative bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-sm">
                                                {/* Avatar */}
                                                {/* Avatar */}
                                                <div
                                                    onClick={() => navigateToProfile(conn)}
                                                    className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden cursor-pointer"
                                                >
                                                    {conn.image ? (
                                                        <img src={conn.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-crown-dark text-white font-bold text-lg">
                                                            {(conn.name?.[0] || '?')}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigateToProfile(conn)}>
                                                    <h3 className="font-bold text-gray-900 truncate">{conn.name}</h3>
                                                    <p className="text-xs text-crown-gold font-medium uppercase tracking-wide">{conn.role}</p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMessage(conn); }}
                                                        className="p-2 text-crown-gold hover:bg-crown-gold/10 rounded-full transition"
                                                        title="Message"
                                                    >
                                                        <FaCommentAlt size={14} />
                                                    </button>

                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === conn.id ? null : conn.id); }}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                                                        >
                                                            <FaEllipsisH size={14} />
                                                        </button>

                                                        {/* Dropdown */}
                                                        {activeMenu === conn.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)} />
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-40 py-1 overflow-hidden animate-enter">
                                                                    <button
                                                                        onClick={() => { handleRemove(conn.id); setActiveMenu(null); }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                    >
                                                                        <FaUserSlash size={12} /> Remove
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { handleBlock(conn.id); setActiveMenu(null); }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                    >
                                                                        <FaBan size={12} /> Block
                                                                    </button>
                                                                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 flex items-center gap-2 cursor-not-allowed">
                                                                        <FaFlag size={12} /> Report
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Overlay */}
            {activeChat && (
                <ChatInterface
                    conversationId={activeChat.id}
                    participants={activeChat.participants}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </>
    );
}

