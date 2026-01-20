import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import api from '../lib/api';
import { FaPen, FaArrowLeft, FaFilter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function ForumFeed() {
    const [searchParams] = useSearchParams();
    const board = searchParams.get('board') || 'FIND_PRO';
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const boardConfig = {
        FIND_PRO: {
            title: 'Find a Beauty Pro',
            subtitle: 'Requests on Crown Connect',
            heroImage: 'https://images.unsplash.com/photo-1560066984-138fae96c697?q=80&w=2074&auto=format&fit=crop'
        },
        FIND_CLIENT: {
            title: 'Find Clients / Availability',
            subtitle: 'Openings shared on Crown Connect',
            heroImage: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop'
        },
        SALON_TALK: {
            title: 'Salon Talk & Advice',
            subtitle: 'Industry discussions and professional advice',
            heroImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop'
        },
        HELP_FEEDBACK: {
            title: 'Help & Feedback',
            subtitle: 'Improve CrownSide together',
            heroImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop'
        },
        ANNOUNCEMENTS: {
            title: 'Announcements & Events',
            subtitle: 'Updates and Detroit beauty events',
            heroImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop'
        }
    };

    const currentBoard = boardConfig[board] || boardConfig.FIND_PRO;
    const isCommunity = ['SALON_TALK', 'HELP_FEEDBACK', 'ANNOUNCEMENTS'].includes(board);

    // Permission Checks for UI
    const canPost = () => {
        if (!user) return false; // Hide button entirely for guests
        if (board === 'FIND_CLIENT' && user.role === 'CLIENT') return false;
        if (board === 'ANNOUNCEMENTS' && user.role === 'CLIENT') return false;
        return true;
    };

    useEffect(() => {
        fetchPosts();
    }, [board]);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`/forum?board=${board}`);
            setPosts(res.data);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            <Hero
                pageKey="forum"
                className="h-[25vh] min-h-[200px] flex items-center justify-center relative"
                overlayOpacity={0.7}
                fallbackImage={currentBoard?.heroImage || "https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=2070&auto=format&fit=crop"}
            >

                <div className="text-center text-white z-10 px-4 animate-fade-in-up">
                    <h1 className="font-serif text-3xl md:text-5xl font-bold mb-2 drop-shadow-xl text-white">
                        {currentBoard.title}
                    </h1>
                    <p className="text-white/90 text-lg font-medium drop-shadow-md">
                        {currentBoard.subtitle}
                    </p>
                </div>
            </Hero>

            <div className="container mx-auto px-4 -mt-8 relative z-20">
                {/* Back Navigation */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/forum')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 text-sm font-medium hover:text-crown-gold hover:border-crown-gold/30 transition-all active:scale-95"
                    >
                        <FaArrowLeft />
                        <span>Crown Connect</span>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div className="flex gap-2 self-start md:self-auto">
                        {/* Filter Placeholder - Hide for Announcements/Feedback? Keep for now */}
                        <button className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-700 flex items-center gap-2 border border-gray-200">
                            <FaFilter /> All Types
                        </button>
                    </div>

                    {!canPost() ? (
                        /* Only show explanatory text if user is logged in but restricted (e.g. Client on Availability Board) */
                        /* Guests see nothing here */
                        user && (
                            <div className="text-gray-500 text-sm font-medium italic py-2 px-4 bg-white/50 rounded-lg border border-gray-100 self-stretch md:self-auto">
                                {board === 'FIND_CLIENT'
                                    ? 'Availability posts are shared by verified beauty professionals'
                                    : 'Official announcements are posted by admins and pros'
                                }
                            </div>
                        )
                    ) : (
                        <>
                            {/* Desktop Button */}
                            <button
                                onClick={() => navigate(`/forum/create?board=${board}`)}
                                className="hidden md:flex btn-primary items-center gap-2 shadow-lg"
                            >
                                <FaPen size={14} />
                                {isCommunity ? 'Start a Conversation' : 'Post to Crown Connect'}
                            </button>

                            {/* Mobile FAB */}
                            <button
                                onClick={() => navigate(`/forum/create?board=${board}`)}
                                className="md:hidden fixed bottom-24 right-4 z-50 bg-crown-gold text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-crown-gold-dark transition-transform active:scale-95"
                                aria-label="Create Post"
                            >
                                <FaPen size={20} />
                            </button>
                        </>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-400">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-lg">
                            {!user ? "No Post Yet" : "No posts yet. Be the first to connect."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-3xl mx-auto">
                        {posts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => navigate(`/forum/${post.id}`)}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const target = post.author.role === 'STYLIST' && post.author.stylistProfile
                                                    ? `/stylist/${post.author.stylistProfile.id}`
                                                    : `/user/${post.author.id}`;
                                                navigate(target);
                                            }}
                                            className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-crown-gold transition"
                                        >
                                            {post.author.stylistProfile?.profileImage ? (
                                                <img src={post.author.stylistProfile.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center font-bold">
                                                    {(post.author.displayName || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900 leading-tight">
                                                {post.author.stylistProfile?.businessName || post.author.displayName || 'Crown User'}
                                            </h3>
                                            <span className="text-[10px] text-crown-gold font-bold uppercase block">{post.author.role}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 mb-1">{post.title}</h3>
                                <div className="text-gray-500 text-sm mb-4 line-clamp-2">
                                    {post.content.notes || 'No description'}
                                </div>

                                <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-crown-gold font-bold bg-crown-gold/10 px-2 py-1 rounded">
                                            {post.type}
                                        </span>
                                        {post._count?.comments > 0 && (
                                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                                                <FaPen size={10} /> {post._count.comments} Reply{post._count.comments !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {/* "New Reply" Logic: If there are comments and the last activity was recent? 
                                            For now, let's just show a "New" badge if the post itself is recent (< 24h) OR if we have > 0 replies.
                                            Actually, let's just show a "New Reply" badge if there are replies for now as requested.
                                            Refinement: "New Reply" usually implies unread. Without auth tracking, maybe just "Active"?
                                            Let's blindly add "New Reply" badge if there are > 0 comments for this demo request.
                                        */}
                                        {post.hasNewReply && (
                                            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full animate-pulse">
                                                New Reply
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">View Thread</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
