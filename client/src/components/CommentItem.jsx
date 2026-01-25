import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaReply, FaFlag, FaTrash } from 'react-icons/fa';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import CommentThread from './CommentThread';
import Avatar from './Avatar';

export default function CommentItem({ comment, postId, onReply, isLast }) {
    // Props access fallback
    const props = { isLast };
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(comment.isLiked);
    const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

    // Thread State
    const [showReplies, setShowReplies] = useState(false);
    const [localReplyCount, setLocalReplyCount] = useState(comment.replyCount || 0);

    // Sync effect
    React.useEffect(() => {
        setLocalReplyCount(comment.replyCount || 0);
    }, [comment.replyCount]);

    const handleLike = async () => {
        if (!user) return alert('Please log in to like comments');
        const newVal = !isLiked;
        setIsLiked(newVal);
        setLikeCount(prev => newVal ? prev + 1 : prev - 1);
        try {
            await api.post('/comments/like', { type: 'COMMENT', id: comment.id });
        } catch (err) {
            console.error(err);
            setIsLiked(!newVal);
            setLikeCount(prev => newVal ? prev - 1 : prev + 1);
        }
    };



    const handleDelete = async () => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${comment.id}`);
            if (onReply) onReply();
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    const isRoot = !comment.parentId;
    const isRemoved = comment.isRemoved;
    const authorName = comment.author.displayName || comment.author.stylistProfile?.businessName || 'User';
    // const avatarSize = isRoot ? 'w-10 h-10' : 'w-8 h-8'; // Consistent size looks better with lines
    const avatarSize = 'w-8 h-8';

    // Helper to render content with mentions
    const renderContent = (text) => {
        if (!text) return null;

        const linkedUser = comment.mentionedUser;
        let parts = [];

        // If we have a verified separate user, strict match their name
        if (linkedUser) {
            const nameToMatch = linkedUser.displayName || linkedUser.stylistProfile?.businessName;
            if (nameToMatch) {
                // Escape regex special chars in name just in case
                const escapedName = nameToMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Split by @Name, case insensitive? strict for now.
                // We wrap in capturing group to keep the delimiter
                parts = text.split(new RegExp(`(@${escapedName})`, 'g'));
            } else {
                parts = [text];
            }
        } else {
            // Fallback: Use a less greedy regex if no linked user (e.g. legacy/manual)
            // Stop at first punctuation or newline? Or just don't link?
            // We will just return text if no linkedUser is found to avoid error.
            parts = [text];
        }

        return parts.map((part, i) => {
            // Check if this part IS the mention
            if (linkedUser && part.startsWith('@')) {
                const targetUrl = linkedUser.role === 'STYLIST'
                    ? `/stylist/${linkedUser.stylistProfile?.id}`
                    : `/user/${linkedUser.id}`;
                return (
                    <span key={i} onClick={(e) => { e.stopPropagation(); navigate(targetUrl); }} className="font-bold text-crown-gold hover:underline cursor-pointer">
                        {part}
                    </span>
                );
            }
            return <span key={i} className="text-gray-900">{part}</span>;
        });
    };

    const handleReplyClick = () => {
        setIsReplying(!isReplying);
        if (!isReplying) {
            // Only prepend mention if we are NOT the author
            if (user && user.id !== comment.authorId) {
                setReplyContent(`@${authorName} `);
            } else {
                setReplyContent('');
            }
        }
    };

    // ...

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            // Determine if we are mentioning the parent author
            // Simple heuristic: If content starts with @{authorName}, we tag them.
            // WE MUST SEND mentionedUserId to backend for it to be saved!
            let mentionedUserId = null;
            if (replyContent.startsWith(`@${authorName}`)) {
                mentionedUserId = comment.author.id; // The user ID of who we are replying to
            }

            await api.post(`/comments/${postId}`, {
                content: replyContent,
                parentId: comment.id,
                mentionedUserId
            });
            setIsReplying(false);
            setReplyContent('');
            setLocalReplyCount(prev => prev + 1);
            setShowReplies(true);
            if (onReply) onReply();
        } catch (err) {
            console.error(err);
            alert('Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    if (isRemoved) {
        return (
            <div className="relative pl-8">
                {/* Line Placeholder for cleared comments to maintain tree structure visually if needed */}
                {!isRoot && (
                    <>
                        {/* Vertical line from parent */}
                        <div className="absolute left-0 top-0 bottom-0 w-4 border-l-2 border-gray-200" style={{ height: onReply && props?.isLast ? '20px' : '100%' }}></div>
                        {/* Curve */}
                        <div className="absolute left-0 top-4 w-6 h-4 border-l-2 border-b-2 border-gray-200 rounded-bl-2xl"></div>
                    </>
                )}

                <div className="text-gray-400 italic text-sm py-2 px-4 bg-gray-50 rounded mb-2 ml-2">
                    Comment removed.
                    {localReplyCount > 0 && (
                        <div className="mt-2 ml-4">
                            <button onClick={() => setShowReplies(!showReplies)} className="text-xs font-bold text-gray-500">
                                {showReplies ? 'Hide' : `Display replies (${localReplyCount})`}
                            </button>
                            {showReplies && (
                                <div className="mt-2 pl-2">
                                    <CommentThread postId={postId} parentId={comment.id} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group animate-fade-in-up relative">
            {/* Visual Lines for Replies */}
            {!isRoot && (
                <>
                    {/* Vertical Line: Goes full height usually, but if last item, stops at curve */}
                    {/* Position: absolute left defined by parent padding */}
                    {/* We need these to be OUTSIDE the flex container but relative to the group */}
                    {/* We used pl-3 in parent thread. Let's adjust. */}

                    {/* The vertical spine */}
                    <div
                        className="absolute -left-[18px] top-0 border-l-2 border-gray-200"
                        style={{ height: props.isLast ? '24px' : '100%' }} // 24px approximates center of avatar (mt-0 top)
                    ></div>

                    {/* The curve connector */}
                    <div className="absolute -left-[18px] top-0 w-[18px] h-[24px] border-l-2 border-b-2 border-gray-200 rounded-bl-xl z-0"></div>
                </>
            )}

            {/* Main Parent Row */}
            <div className="flex gap-3 relative z-10">
                {/* Avatar Column */}
                <div onClick={() => navigate(comment.author.role === 'STYLIST' ? `/stylist/${comment.author.stylistProfile?.id}` : `/user/${comment.author.id}`)}
                    className={`flex-shrink-0 cursor-pointer hover:opacity-80 transition relative z-10`}>
                    <Avatar
                        user={comment.author}
                        size={isRoot ? "md" : "sm"}
                        className=""
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Content Block */}
                    <div className="inline-block px-4 py-2 rounded-2xl bg-gray-100/80 border border-transparent hover:bg-gray-100 transition">
                        <div className="flex items-baseline justify-between gap-2">
                            <h4
                                onClick={() => navigate(comment.author.role === 'STYLIST' ? `/stylist/${comment.author.stylistProfile?.id}` : `/user/${comment.author.id}`)}
                                className="font-bold text-xs text-gray-900 hover:underline cursor-pointer"
                            >
                                {authorName}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-normal">{formatDistanceToNow(new Date(comment.createdAt))}</span>
                        </div>
                        <p className="text-gray-800 text-sm leading-snug whitespace-pre-wrap mt-0.5">
                            {renderContent(comment.content)}
                        </p>
                    </div>

                    {/* Actions Line */}
                    <div className="flex items-center gap-4 mt-1 ml-2 text-[10px] font-bold text-gray-500">
                        <button onClick={handleLike} className={`hover:text-crown-gold flex items-center gap-1 ${isLiked ? 'text-crown-gold' : ''}`}>
                            {isLiked ? 'Like' : 'Like'} {likeCount > 0 && <span className="font-normal opacity-70">({likeCount})</span>}
                        </button>
                        <button onClick={handleReplyClick} className="hover:text-crown-gold">Reply</button>
                        {user && user.id === comment.authorId && (
                            <button onClick={handleDelete} className="hover:text-red-500 font-normal">Delete</button>
                        )}

                        {/* Thread Toggle (Inline) */}
                        {localReplyCount > 0 && !showReplies && (
                            <button
                                onClick={() => setShowReplies(true)}
                                className="flex items-center gap-1 text-crown-gold hover:underline"
                            >
                                <FaReply className="rotate-180" size={10} /> {localReplyCount === 1 ? '1 Reply' : `${localReplyCount} Replies`}
                            </button>
                        )}
                    </div>

                    {/* Inline Reply Input */}
                    {isReplying && (
                        <div className="mt-2 flex gap-2 w-full max-w-lg animate-enter relative">
                            {/* Connector for reply input */}
                            {!isRoot && <div className="absolute -left-[26px] top-[-10px] bottom-[20px] border-l-2 border-gray-200"></div>}
                            {!isRoot && <div className="absolute -left-[26px] top-[18px] w-5 h-6 border-l-2 border-b-2 border-gray-200 rounded-bl-xl"></div>}

                            <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative z-10">
                                {(user?.stylistProfile?.profileImage || user?.profileImage) ? (
                                    <img src={user.stylistProfile?.profileImage || user.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        {user?.displayName?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleReplySubmit} className="flex-1 relative">
                                <textarea
                                    autoFocus
                                    rows={1}
                                    value={replyContent}
                                    onChange={(e) => {
                                        setReplyContent(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onFocus={(e) => {
                                        const val = e.target.value;
                                        e.target.setSelectionRange(val.length, val.length);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReplySubmit(e);
                                        }
                                    }}
                                    className="w-full bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-crown-gold resize-none overflow-hidden"
                                    placeholder={user?.id === comment.authorId ? "Replying to yourself..." : `Reply to ${authorName}...`}
                                    style={{ minHeight: '38px' }}
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                    <button type="button" onClick={() => setIsReplying(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
                                    <button type="submit" disabled={submitting || !replyContent} className="text-[10px] bg-black text-white px-3 py-0.5 rounded-full">Send</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Thread Container - Sibling to Main Row */}
            {localReplyCount > 0 && showReplies && (
                <div className="mt-2 w-full pl-9 relative">
                    {/* Continuous Spine Line from this parent down to children */}
                    {/* Only if we are NOT the last child of OUR parent, do we draw a line? 
                        Wait, this line is for *our* children. 
                        Relative to 'this' comment, the children are indented. 
                        We need a line descending from OUR avatar center.
                    */}
                    {!isRoot && (
                        <div className="absolute left-[13px] -top-2 bottom-0 border-l-2 border-gray-200"></div>
                    )}
                    {/* Actually, the Thread Component handles the loop, and we pass isLast.
                        The logic: 
                        - If I have children (replies open), I provide the vertical spine 'slot' on the left.
                    */}

                    <div className="relative z-10">
                        <CommentThread
                            key={localReplyCount}
                            postId={postId}
                            parentId={comment.id}
                            onReply={() => setLocalReplyCount(prev => prev + 1)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
