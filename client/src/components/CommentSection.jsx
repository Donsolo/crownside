import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentThread from './CommentThread';
import api from '../lib/api';
import { FaPaperPlane } from 'react-icons/fa';

export default function CommentSection({ postId }) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // We need a way to refresh the root thread when a new top-level comment is added.
    const [refreshKey, setRefreshKey] = useState(0);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) return alert('Please log in to comment');

        setSubmitting(true);
        try {
            await api.post(`/comments/${postId}`, { content: newComment });
            setNewComment('');
            setRefreshKey(prev => prev + 1); // Trigger re-mount/re-fetch of root thread
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="font-serif font-bold text-xl text-gray-900 mb-6">
                Discussion
            </h3>

            {/* Root Thread */}
            <div className="mb-8">
                <CommentThread
                    key={refreshKey}
                    postId={postId}
                    parentId={null}
                    onReply={() => setRefreshKey(prev => prev + 1)} // Refresh root if child triggers? Mostly child handles itself.
                />
            </div>

            {/* Root Input */}
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                        {(user?.stylistProfile?.profileImage || user?.profileImage) ? (
                            <img src={user.stylistProfile?.profileImage || user.profileImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span>{user?.displayName?.[0] || '?'}</span>
                        )}
                    </div>
                </div>
                <form onSubmit={handlePostComment} className="flex-grow">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Join the conversation..." : "Log in to comment..."}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-crown-gold focus:outline-none resize-none transition-all"
                        rows="2"
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
