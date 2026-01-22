import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import CommentItem from './CommentItem';

const CommentThread = ({ postId, parentId = null, initialComments = [], onReply }) => {
    const [comments, setComments] = useState(initialComments);
    const [loading, setLoading] = useState(initialComments.length === 0);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Initial fetch if no initial comments and we want to load (mostly for roots, but roots usually passed in)
    // Actually, for child threads, we start empty and load on "Display replies".
    // For root list, we might pass initialComments.

    // Logic:
    // If parentId is null (Root Thread), we might fetch immediately or receive probs.
    // If parentId is set (Child Thread), we wait for interaction (controlled by parent CommentItem).
    // Wait, the recursion logic:
    // CommentItem -> has "View X replies".
    // When clicked -> it expands "CommentThread parentId={comment.id}".
    // That CommentThread should fetch.

    useEffect(() => {
        if (initialComments.length === 0) {
            loadComments();
        } else {
            setLoading(false);
        }
    }, [postId, parentId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const limit = parentId ? 2 : 10; // 2 for replies, 10 for roots
            const res = await api.get(`/comments/${postId}`, {
                params: {
                    parentId: parentId || 'null',
                    limit,
                    cursor: nextCursor
                }
            });

            const newComments = res.data.comments;
            setComments(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = newComments.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
            setNextCursor(res.data.nextCursor);
            setHasMore(!!res.data.nextCursor);
        } catch (err) {
            console.error("Failed to load threads", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        loadComments();
    };

    // Expose a refresh method or handle new comment injection?
    // We can pass `onReply` down.

    return (
        <div className={`flex flex-col gap-2 ${parentId ? 'ml-0' : 'space-y-4'}`}>
            {/* 
                Visual Hierarchy handled in CommentItem styling? 
                Thread just renders list.
            */}

            {comments.map((comment, index) => (
                <div key={comment.id} className="relative">
                    <CommentItem
                        comment={comment}
                        postId={postId}
                        onReply={onReply}
                        isLast={index === comments.length - 1}
                    />
                </div>
            ))}

            {loading && <div className="text-sm text-gray-500 py-2 ml-4">Loading...</div>}

            {!loading && hasMore && (
                <button
                    onClick={handleLoadMore}
                    className="text-sm font-bold text-gray-700 hover:text-crown-gold text-left ml-4 py-1 flex items-center gap-1"
                >
                    <span className="opacity-50">↳</span> Display more replies
                </button>
            )}
        </div>
    );
};

export default CommentThread;
