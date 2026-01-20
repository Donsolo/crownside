import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import CommentItem from './CommentItem';
import { FaPaperPlane } from 'react-icons/fa';

export default function CommentSection({ postId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [modMenuOpen, setModMenuOpen] = useState(false); // Used in PostDetail if moved, but here we are in CommentSection. Wait. CommentSection doesn't need mod menu state. PostDetail does. 


    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/comments/${postId}`); // Requires auth optional handling on backend for likes
            setComments(res.data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) return alert('Please log in to comment');

        setSubmitting(true);
        try {
            await api.post(`/comments/${postId}`, { content: newComment });
            setNewComment('');
            fetchComments(); // Refresh list to see new comment
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    // Organize comments into threads (Parent -> Children) recursively
    const threadComments = () => {
        const map = {};
        const roots = [];

        // First pass: Initialize map
        comments.forEach(c => {
            map[c.id] = { ...c, replies: [] };
        });

        // Second pass: Link children to parents
        comments.forEach(c => {
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].replies.push(map[c.id]);
            } else if (!c.parentId) {
                roots.push(map[c.id]);
            }
            // Note: If parentId exists but not in map (deleted?), distinct handling might be needed, 
            // but for now we assume consistency or orphan them.
        });

        return roots;
    };

    const threads = threadComments();

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="font-serif font-bold text-xl text-gray-900 mb-6">
                Discussion ({comments.length})
            </h3>

            {/* Comments List (First) */}
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading comments...</div>
            ) : threads.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic mb-8">No comments yet. Be the first to verify or answer!</div>
            ) : (
                <div className="space-y-4 mb-8">
                    {threads.map(root => (
                        <CommentItem key={root.id} comment={root} onRefresh={fetchComments} />
                    ))}
                </div>
            )}

            {/* Comment Input (Second) */}
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold">
                        {user?.displayName?.[0] || '?'}
                    </div>
                </div>
                <form onSubmit={handlePostComment} className="flex-grow">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Join the conversation..." : "Log in to comment..."}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none resize-none transition-all"
                        rows="3"
                        disabled={!user}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={submitting || !user}
                            className="bg-crown-gold text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-black transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? 'Posting...' : <>Post Comment <FaPaperPlane size={12} /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
