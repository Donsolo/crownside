const prisma = require('../prisma');

// --- COMMENTS ---

const createComment = async (req, res) => {
    const authorId = req.user.id;
    const { postId } = req.params;
    const { content, parentId, mentionedUserId } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    try {
        // MUTE CHECK
        const user = await prisma.user.findUnique({ where: { id: authorId }, select: { mutedUntil: true } });
        if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
            return res.status(403).json({ error: `You have been temporarily muted until ${new Date(user.mutedUntil).toLocaleString()}` });
        }

        let depth = 0;
        let finalParentId = parentId || null;
        let parentComment = null;

        if (parentId) {
            parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
            if (parentComment) {
                depth = (parentComment.depth || 0) + 1;

                // STRICT MAX DEPTH: 3 - Sibling Strategy
                if (depth > 3) {
                    depth = 3;
                    finalParentId = parentComment.parentId;
                    // Note: Visually flattening, but "parent" context for notification is still original parent?
                    // Actually, if we re-parent, the "reply" is technically to the grandparent in the tree.
                    // But conceptually, the user replied to the specific comment.
                    // We should still notify the user they *intended* to reply to.
                }
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId,
                postId,
                parentId: finalParentId,
                depth,
                mentionedUserId: mentionedUserId || null
            },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        displayName: true,
                        role: true,
                        profileImage: true, // [NEW] Added for Clients
                        stylistProfile: { select: { id: true, businessName: true, profileImage: true } }
                    }
                },
                mentionedUser: {
                    select: {
                        id: true,
                        displayName: true,
                        stylistProfile: { select: { businessName: true } }
                    }
                }
            }
        });

        // Update Post's updatedAt
        await prisma.forumPost.update({
            where: { id: postId },
            data: { updatedAt: new Date() }
        });

        // --- NOTIFICATION LOGIC ---
        // Fetch Post for Author Info
        const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { authorId: true } });

        const notifications = [];
        const recipients = new Set(); // To prevent double notifying same user for different reasons (simple approach)

        // 1. REPLY NOTIFICATION (Highest Priority)
        // If there was a parent comment (even if we flattened structure), notify that author.
        if (parentComment && parentComment.authorId !== authorId) {
            notifications.push({
                userId: parentComment.authorId,
                senderId: authorId,
                type: 'REPLY',
                postId,
                commentId: comment.id
            });
            recipients.add(parentComment.authorId);
        }

        // 2. NEW COMMENT NOTIFICATION
        // Notify Post Author if they are NOT the commenter AND NOT already notified via Reply
        if (post && post.authorId !== authorId && !recipients.has(post.authorId)) {
            notifications.push({
                userId: post.authorId,
                senderId: authorId,
                type: 'NEW_COMMENT',
                postId,
                commentId: comment.id
            });
            recipients.add(post.authorId);
        }

        // 3. MENTION NOTIFICATION
        // Notify mentioned user if NOT the commenter AND NOT already notified (Reply/Post Author)
        if (mentionedUserId && mentionedUserId !== authorId && !recipients.has(mentionedUserId)) {
            notifications.push({
                userId: mentionedUserId,
                senderId: authorId,
                type: 'MENTION',
                postId,
                commentId: comment.id
            });
        }

        // Bulk Create
        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error("Create Comment Error:", error);
        res.status(500).json({ error: 'Failed to post comment' });
    }
};

const getComments = async (req, res) => {
    const { postId } = req.params;
    const { parentId = null, limit = 50, cursor } = req.query; // limit default 50 for roots? User said "Load ONLY first 2 child". limit needs to be variable.
    // For roots, maybe 10 or 20. For replies, 2.
    // I will let frontend pass limit.

    const userId = req.user ? req.user.id : null;

    try {
        const queryOptions = {
            where: {
                postId,
                parentId: parentId === 'null' ? null : parentId // Handle string 'null'
            },
            take: parseInt(limit),
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                        role: true,
                        profileImage: true, // [NEW] Added for Clients
                        stylistProfile: { select: { id: true, businessName: true, profileImage: true } }
                    }
                },
                mentionedUser: {
                    select: {
                        id: true,
                        displayName: true,
                        stylistProfile: { select: { businessName: true } }
                    }
                },
                likes: {
                    where: { userId: userId || '0' },
                    select: { id: true }
                },
                _count: {
                    select: { likes: true, replies: true }
                }
            }
        };

        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1; // Skip the cursor itself
        }

        const comments = await prisma.comment.findMany(queryOptions);

        const enhancedComments = comments.map(c => ({
            ...c,
            isLiked: c.likes.length > 0,
            likeCount: c._count.likes,
            replyCount: c._count.replies
        }));

        // Determine next cursor
        const nextCursor = comments.length === parseInt(limit) ? comments[comments.length - 1].id : null;

        res.json({
            comments: enhancedComments,
            nextCursor
        });
    } catch (error) {
        console.error("fetchComments Error:", error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// --- LIKES ---

const toggleLike = async (req, res) => {
    const userId = req.user.id;
    const { type, id } = req.body; // type: 'POST' or 'COMMENT', id: targetId

    try {
        if (type === 'POST') {
            const existing = await prisma.like.findUnique({
                where: { userId_postId: { userId, postId: id } }
            });

            if (existing) {
                await prisma.like.delete({ where: { id: existing.id } });
                return res.json({ liked: false });
            } else {
                await prisma.like.create({
                    data: { userId, postId: id }
                });
                return res.json({ liked: true });
            }
        } else if (type === 'COMMENT') {
            const existing = await prisma.like.findUnique({
                where: { userId_commentId: { userId, commentId: id } }
            });

            if (existing) {
                await prisma.like.delete({ where: { id: existing.id } });
                return res.json({ liked: false });
            } else {
                await prisma.like.create({
                    data: { userId, commentId: id }
                });
                return res.json({ liked: true });
            }
        } else {
            return res.status(400).json({ error: 'Invalid like type' });
        }
    } catch (error) {
        console.error("Like Error:", error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

const deleteComment = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const comment = await prisma.comment.findUnique({ where: { id } });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.authorId !== userId) {
            // Check if admin/mod? For this specific endpoint "user soft delete", strictly owner?
            // "Moderators and Admins retain existing removal powers".
            // Mods usually use the moderation/action endpoint. 
            // This endpoint is specifically for the author.
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        const updated = await prisma.comment.update({
            where: { id },
            data: {
                isRemoved: true,
                removedBy: userId,
                removedReason: 'User deleted',
                removedAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

module.exports = {
    createComment,
    getComments,
    toggleLike,
    deleteComment
};
