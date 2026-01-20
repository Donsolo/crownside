import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExclamationTriangle, FaUserCircle, FaMapMarkerAlt, FaCalendarAlt, FaEnvelope, FaLock, FaTrash, FaCheck, FaUserSlash } from 'react-icons/fa';
import Hero from '../components/Hero';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ChatInterface from '../components/ChatInterface';
import CommentSection from '../components/CommentSection';

export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportModal, setReportModal] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const [modMenuOpen, setModMenuOpen] = useState(false);
    const modMenuRef = useRef(null);

    useEffect(() => {
        fetchPost();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modMenuRef.current && !modMenuRef.current.contains(event.target)) {
                setModMenuOpen(false);
            }
        };

        if (modMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modMenuOpen]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/forum/${id}`);
            setPost(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!user) return navigate('/login');
        if (post.authorId === user.id) return alert("You can't message yourself!");

        // In a real app, we might need to pre-create conversation or check if exists based on context
        // For now, we'll try to leverage the existing system. 
        // NOTE: Existing system typically links conversation to a BOOKING. 
        // Linking to a POST is a new paradigm. 
        // For Phase 1: We will initiate a conversation but we might need a dummy booking or adapt the schema.
        // CHECKUP: Schema has `bookingId` as unique in Conversation. We can't easily start a chat without a booking.
        // HACK/PIVOT for Phase 1: We will prompt "Message" to redirect to their profile to "Book" or use a specialized request flow?
        // OR: We update schema to allow Conversation to be loose (Booking optional). 
        // Let's stick to the prompt: messaging is key.
        // Plan B: Create a "Inquiry" Booking status? 
        // OPTION C (Chosen): Just show an error implementing fully requires schema change for loose conversations.
        // WAIT: The prompt says "Opens existing client<->stylist messaging system".

        alert("Messaging integration requires Schema update to support Non-Booking conversations. Placeholder.");
    };

    const handleReport = async (reason) => {
        setReporting(true);
        try {
            await api.post(`/forum/${id}/report`, { reason });
            setReportModal(false);
            alert('Report submitted. Thank you.');
        } catch (err) {
            alert('Failed to submit report');
        } finally {
            setReporting(false);
        }
    };

    const handleModAction = async (action, duration = null) => {
        if (!window.confirm(`Are you sure you want to ${action} this post?`)) return;
        try {
            await api.post('/moderation/action', {
                action,
                targetType: action === 'MUTE' ? 'USER' : 'POST',
                targetId: action === 'MUTE' ? post.authorId : post.id,
                duration
            });
            fetchPost(); // Refresh state
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    const isMod = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!post) return <div className="p-8 text-center">Post not found</div>;

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header / Hero */}
            <Hero
                pageKey="forum"
                className="h-[20vh] min-h-[160px] flex items-center justify-center relative mb-6"
                overlayOpacity={0.7}
                fallbackImage="https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=2070&auto=format&fit=crop"
            >
                <div className="absolute bottom-4 left-4 z-20">
                    <button onClick={() => navigate(-1)} className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-md hover:bg-gray-50 transition flex items-center gap-2">
                        <FaArrowLeft size={12} /> Back
                    </button>
                </div>
                {/* Report removed from Hero */}
                {/* Optional: We could put the Title here, but it's currently in the card below. 
                    Let's keep the hero simple as a branding/consistency element 
                    and keep the title in the card for readability. 
                    Or maybe just "Community Conversation" text? */}
                <div className="text-center text-white z-10 px-4">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold drop-shadow-xl text-white">
                        Crown Connect Conversation
                    </h2>
                </div>
            </Hero>

            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Author Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                {(post.author.stylistProfile?.profileImage) ? (
                                    <img src={post.author.stylistProfile.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><FaUserCircle /></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{post.author.stylistProfile?.businessName || post.author.displayName || 'Crown User'}</h3>
                                <span className="text-xs text-crown-gold font-bold uppercase">{post.author.role}</span>
                            </div>
                        </div>
                        <button onClick={() => setReportModal(true)} className="text-gray-400 hover:text-red-500 transition text-sm flex items-center gap-1">
                            <FaExclamationTriangle /> <span className="hidden sm:inline">Report</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Mod Banners */}
                        {post.status === 'REMOVED' && (
                            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 font-bold text-center border border-red-200">
                                <FaTrash className="inline mr-2" /> Ths post has been removed by moderation.
                            </div>
                        )}
                        {post.isLocked && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4 font-bold text-center border border-yellow-200">
                                <FaLock className="inline mr-2" /> This thread is locked.
                            </div>
                        )}

                        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">{post.title}</h1>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="text-xs font-bold bg-crown-gold/10 text-crown-gold px-2 py-1 rounded">{post.type}</span>
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1"><FaMapMarkerAlt /> {post.content.location || 'Detroit'}</span>
                            {post.content.date && <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1"><FaCalendarAlt /> {post.content.date}</span>}
                            {post.status === 'RESOLVED' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><FaCheck /> Resolved</span>}
                        </div>

                        <p className="text-gray-700 whitespace-pre-wrap mb-6">{post.content.notes}</p>

                        {/* Structured Data Display */}
                        {post.content.budget && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-4 inline-block">
                                <span className="text-xs font-bold text-green-800 uppercase block">Budget</span>
                                <span className="text-green-900 font-bold">{post.content.budget}</span>
                            </div>
                        )}

                        {/* Images */}
                        {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {post.images.map(img => (
                                    <img key={img.id} src={img.url} alt="Post" className="rounded-lg w-full h-48 object-cover" />
                                ))}
                            </div>
                        )}

                        {/* MODERATOR ACTIONS */}
                        {/* MODERATOR ACTIONS (Menu) */}
                        {isMod && (
                            <div className="mt-8 pt-6 border-t border-gray-100 relative" ref={modMenuRef}>
                                <button
                                    onClick={() => setModMenuOpen(!modMenuOpen)}
                                    className="text-gray-400 hover:text-gray-900 font-bold text-sm bg-gray-50 px-3 py-1.5 rounded border border-gray-200"
                                >
                                    ⋯ Moderation
                                </button>

                                {modMenuOpen && (
                                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-white shadow-xl border border-gray-200 rounded-lg p-2 z-10 flex flex-col gap-1 fade-in">
                                        <button onClick={() => { setModMenuOpen(false); handleModAction(post.isLocked ? 'UNLOCK' : 'LOCK'); }} className="text-left w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2">
                                            <FaLock size={12} /> {post.isLocked ? 'Unlock Thread' : 'Lock Thread'}
                                        </button>

                                        {post.status !== 'REMOVED' && (
                                            <button onClick={() => { setModMenuOpen(false); handleModAction('REMOVE'); }} className="text-left w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2">
                                                <FaTrash size={12} /> Remove Post
                                            </button>
                                        )}

                                        {post.board === 'HELP_FEEDBACK' && post.status !== 'RESOLVED' && (
                                            <button onClick={() => { setModMenuOpen(false); handleModAction('RESOLVE'); }} className="text-left w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded flex items-center gap-2">
                                                <FaCheck size={12} /> Mark Resolved
                                            </button>
                                        )}

                                        <button onClick={() => { setModMenuOpen(false); handleModAction('MUTE', 24); }} className="text-left w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded flex items-center gap-2 border-t border-gray-100 mt-1 pt-2">
                                            <FaUserSlash size={12} /> Mute Author (24h)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions / Comments */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        {(!['SALON_TALK', 'HELP_FEEDBACK', 'ANNOUNCEMENTS'].includes(post.board)) && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={handleMessage}
                                    className="btn-primary flex items-center gap-2 shadow-lg"
                                >
                                    <FaEnvelope /> Message {post.author.role === 'STYLIST' ? 'Pro' : 'Client'}
                                </button>
                            </div>
                        )}

                        <CommentSection postId={post.id} />
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {reportModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportModal(false)} />
                    <div className="bg-white p-6 rounded-xl relative max-w-sm w-full z-10">
                        <h3 className="font-bold text-lg mb-4">Report Content</h3>
                        <div className="space-y-2">
                            {['Spam', 'Inappropriate Content', 'Scam / Fraud', 'Harassment'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => handleReport(r)}
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setReportModal(false)} className="mt-4 text-gray-500 w-full text-center text-sm">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
