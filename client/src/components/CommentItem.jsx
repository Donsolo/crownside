import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaReply, FaFlag, FaTrash } from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function CommentItem({ comment, depth = 0, onRefresh }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(comment.isLiked);
    const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

    const handleLike = async () => {
        if (!user) return alert('Please log in to like comments');

        // Optimistic update
        const newVal = !isLiked;
        setIsLiked(newVal);
        setLikeCount(prev => newVal ? prev + 1 : prev - 1);

        try {
            await api.post('/comments/like', { type: 'COMMENT', id: comment.id });
        } catch (err) {
            console.error(err);
            // Revert on error
            setIsLiked(!newVal);
            setLikeCount(prev => newVal ? prev - 1 : prev + 1);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            // Logic: Nested replies always store the immediate parent's ID in DB
            await api.post(`/comments/${comment.postId}`, {
                content: replyContent,
                parentId: comment.id
            });
            setIsReplying(false);
            setReplyContent('');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    // VISUAL DEPTH RULES
    // Depth 0: Full UI
    // Depth 1: Compact UI
    // Depth 2+: Minimal UI (Micro avatar, hidden timestamp, grouped actions)
    const isDeep = depth >= 2;
    const isRoot = depth === 0;

    // EXPANSION LOGIC
    // Depth 0 & 1: Fully expanded by default
    // Depth 2+: Start with 2 visible, expand in batches
    const [visibleCount, setVisibleCount] = useState(depth < 2 ? 999 : 2);

    // Actions Menu State (for Deep threads)
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Helpers for styles
    const avatarSize = isRoot ? 'w-8 h-8' : (isDeep ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs');
    const textSize = isDeep ? 'text-xs' : 'text-sm';

    // Handlers
    const handleShowMore = () => setVisibleCount(prev => prev + 3);
    const handleShowLess = () => setVisibleCount(2);

    const handleRemove = async () => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            if (user && user.id === comment.authorId) {
                await api.delete(`/comments/${comment.id}`);
            } else {
                await api.post('/moderation/action', {
                    action: 'REMOVE',
                    targetType: 'COMMENT',
                    targetId: comment.id
                });
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to remove comment');
        }
    };

    const isMod = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');
    const isRemoved = comment.isRemoved;
    const authorName = comment.author.displayName || comment.author.stylistProfile?.businessName || 'User';
    const removedText = comment.removedBy === comment.authorId ? "This comment was deleted by its author." : "Comment removed by moderator.";

    // MENTION HANDLER
    const [replyToUser, setReplyToUser] = useState(null);

    const startReply = () => {
        setIsReplying(true);
        const targetUser = comment.author;
        setReplyToUser(targetUser);
    };

    const handleReplySubmitInternal = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/comments/${comment.postId}`, {
                content: replyContent,
                parentId: comment.id,
                mentionedUserId: replyToUser?.id
            });
            setReplyContent('');
            setIsReplying(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    if (isRemoved && !isMod) {
        return (
            <div className={`mb-3 ${depth > 0 ? 'ml-3 pl-3 border-l-2 border-gray-100' : 'mb-6'}`}>
                <div className="text-gray-400 italic text-xs py-1">{removedText}</div>
                {comment.replies?.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} depth={depth + 1} onRefresh={onRefresh} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`
            ${depth > 0 ? 'ml-3 pl-3 border-l-2 border-gray-100' : 'mb-6 pb-2 border-b border-gray-50 last:border-0'}
            transition-all duration-300
        `}>
            {/* Comment Row */}
            <div className="flex gap-2 group relative">
                {/* Avatar */}
                <div
                    className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                            comment.author.role === 'STYLIST' && comment.author.stylistProfile
                                ? `/stylist/${comment.author.stylistProfile.id}`
                                : `/user/${comment.author.id}`
                        );
                    }}
                >
                    {comment.author.profileImage ? (
                        <img src={comment.author.profileImage} alt="User" className={`rounded-full object-cover ${avatarSize}`} />
                    ) : (
                        <div className={`bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold ${avatarSize}`}>
                            {comment.author.displayName?.[0] || 'U'}
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                    comment.author.role === 'STYLIST' && comment.author.stylistProfile
                                        ? `/stylist/${comment.author.stylistProfile.id}`
                                        : `/user/${comment.author.id}`
                                );
                            }}
                            className={`font-bold text-gray-900 ${isDeep ? 'text-xs' : 'text-sm'} cursor-pointer hover:text-crown-gold hover:underline transition`}
                        >
                            {authorName}
                        </span>

                        {/* MENTION DISPLAY */}
                        {comment.mentionedUser && (() => {
                            const mentionedName = comment.mentionedUser.displayName ||
                                comment.mentionedUser.stylistProfile?.businessName ||
                                'User';
                            return (
                                <span className="text-crown-gold font-medium text-xs">
                                    @{mentionedName}
                                </span>
                            );
                        })()}

                        {!isDeep && (
                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                        )}
                    </div>

                    <div className={`${textSize} text-gray-700 whitespace-pre-wrap ${isDeep ? 'mt-0' : 'mt-0.5'} leading-snug`}>
                        {comment.content}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {/* Standard Actions (Depth 0-1) */}
                        {!isDeep && (
                            <>
                                <button onClick={handleLike} className={`text-xs font-bold flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-black py-1'}`}>
                                    {isLiked ? <FaHeart size={10} /> : <FaRegHeart size={10} />} {likeCount > 0 ? likeCount : 'Like'}
                                </button>

                                <button onClick={startReply} className="text-xs font-bold text-gray-400 hover:text-crown-gold flex items-center gap-1 py-1">
                                    <FaReply size={10} /> Reply
                                </button>

                                <button className="text-[10px] font-medium text-gray-300 hover:text-gray-500 flex items-center gap-1 py-1">
                                    <FaFlag size={8} /> Report
                                </button>

                                {(isMod || (user?.id === comment.authorId)) && (
                                    <button onClick={handleRemove} className="text-[10px] text-gray-300 hover:text-red-500 flex items-center gap-1 py-1">
                                        <FaTrash size={8} />
                                    </button>
                                )}
                            </>
                        )}

                        {/* Minimal Actions (Depth 2+) */}
                        {isDeep && (
                            <>
                                <button onClick={startReply} className="text-[10px] font-bold text-gray-500 hover:text-crown-gold py-0.5">
                                    Reply
                                </button>

                                {/* Overflow Menu Trigger */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                                        className="text-gray-300 hover:text-gray-600 px-1 py-0.5"
                                    >
                                        •••
                                    </button>

                                    {showActionsMenu && (
                                        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-md rounded-md z-10 py-1 min-w-[100px] flex flex-col">
                                            <button
                                                onClick={() => { handleLike(); setShowActionsMenu(false); }}
                                                className={`text-xs text-left px-3 py-2 w-full hover:bg-gray-50 ${isLiked ? 'text-red-500 font-bold' : 'text-gray-600'}`}
                                            >
                                                {isLiked ? 'Unlike' : 'Like'} ({likeCount})
                                            </button>
                                            <button className="text-xs text-left text-gray-600 px-3 py-2 w-full hover:bg-gray-50">
                                                Report
                                            </button>
                                            {(isMod || (user?.id === comment.authorId)) && (
                                                <button onClick={handleRemove} className="text-xs text-left text-red-500 px-3 py-2 w-full hover:bg-red-50">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Inline Reply Form */}
                    {isReplying && (
                        <div className="mt-2 animate-fade-in-down mb-2">
                            {/* Visual Mention Badge */}
                            <div className="text-xs text-crown-gold font-bold mb-1">
                                Replying to @{replyToUser?.displayName || authorName}
                            </div>

                            <form onSubmit={handleReplySubmitInternal} className="flex gap-2 items-start">
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="w-full text-sm bg-transparent border-b border-crown-gold/50 focus:border-crown-gold transition-colors px-0 py-1 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-1.5">
                                        <button type="button" onClick={() => setIsReplying(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
                                        <button type="submit" disabled={submitting || !replyContent.trim()} className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-bold disabled:opacity-50">
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Children Rendering with Batch Expansion */}
            {comment.replies && comment.replies.length > 0 && (
                <div className={`mt-2 ${isRoot ? 'space-y-4' : 'space-y-2'}`}>
                    {(() => {
                        const allReplies = comment.replies;
                        const visibleReplies = allReplies.slice(0, visibleCount);
                        const hiddenCount = allReplies.length - visibleReplies.length;

                        return (
                            <>
                                {visibleReplies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        depth={depth + 1}
                                        onRefresh={onRefresh}
                                    />
                                ))}

                                {hiddenCount > 0 ? (
                                    <button
                                        onClick={handleShowMore}
                                        className="text-xs font-bold text-crown-gold hover:underline flex items-center gap-1 ml-2 py-1"
                                    >
                                        View {Math.min(3, hiddenCount)} more {hiddenCount === 1 ? 'reply' : 'replies'}...
                                    </button>
                                ) : (
                                    // Only show hide option if we actually expanded something (count > 2) and used to adhere to batch limit
                                    visibleCount > 2 && allReplies.length > 2 && depth >= 2 && (
                                        <button
                                            onClick={handleShowLess}
                                            className="text-[10px] text-gray-300 hover:text-gray-500 ml-2 py-1 block"
                                        >
                                            Hide replies
                                        </button>
                                    )
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
