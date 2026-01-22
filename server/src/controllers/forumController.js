const prisma = require('../prisma');

// --- POSTS ---

const createPost = async (req, res) => {
    const authorId = req.user.id;
    const { board, type, title, content, images } = req.body; // images is array of URLs

    try {
        // RATE LIMIT CHECK: Max 1 post per day for new accounts (< 3 days old) logic could go here
        // For Phase 1, strictly: Max 2 posts per 24h per user to prevent spam
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        const recentPosts = await prisma.forumPost.count({
            where: {
                authorId,
                createdAt: { gte: yesterday }
            }
        });

        if (recentPosts >= 2) {
            return res.status(429).json({ error: 'Rate limit exceeded. You can only create 2 posts per 24 hours.' });
        }

        // MUTE CHECK
        const user = await prisma.user.findUnique({ where: { id: authorId }, select: { mutedUntil: true, role: true } });

        if (!user) {
            return res.status(401).json({ error: 'User not found. Please log in again.' });
        }

        if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
            return res.status(403).json({ error: `You have been temporarily muted until ${new Date(user.mutedUntil).toLocaleString()}` });
        }

        // --- PERMISSION CHECKS ---

        // 1. FIND_CLIENT: Stylists ONLY
        if (board === 'FIND_CLIENT' && req.user.role === 'CLIENT') {
            return res.status(403).json({ error: 'Only beauty professionals can post availability on Crown Connect.' });
        }

        // 2. ANNOUNCEMENTS: Admins & Stylists (Events) ONLY
        if (board === 'ANNOUNCEMENTS' && req.user.role === 'CLIENT') {
            return res.status(403).json({ error: 'Only administrators and professionals can post announcements/events.' });
        }

        // 3. MISUSE DETECTION (Anti-Spam for Community Boards)
        // Boards: SALON_TALK, HELP_FEEDBACK
        const COMMUNITY_BOARDS = ['SALON_TALK', 'HELP_FEEDBACK'];
        if (COMMUNITY_BOARDS.includes(board)) {
            // Relaxed Regex: Allow "pricing" discussion, block explicit solicitation
            const spamRegex = /(dm to book|link in bio|booking via dm|deposit ready|cash app \$|slots filling|book now)/i;
            const fullText = `${title} ${content?.notes || ''} ${JSON.stringify(content || {})}`;

            if (spamRegex.test(fullText)) {
                return res.status(400).json({
                    error: 'Community posts strictly meant for discussion. For booking/pricing, please use the "Find a Beauty Pro" or "Availability" boards.'
                });
            }
        }

        console.log("CreatePost: Attempting to create in DB...");
        const post = await prisma.forumPost.create({
            data: {
                authorId,
                board,
                type: type || 'GENERAL', // Fallback for community posts
                title,
                content: content || {}, // Ensure not null
                images: {
                    create: images?.map(url => ({ url })) || []
                }
            },
            include: { images: true, author: { select: { displayName: true, role: true, stylistProfile: { select: { businessName: true, profileImage: true, subscription: { select: { planKey: true } } } } } } }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

const getPosts = async (req, res) => {
    const { board, type, limit = 20, cursor } = req.query;

    try {
        const where = {
            status: 'OPEN' // Default to open posts
        };

        if (board) where.board = board;
        if (type) where.type = type;

        const posts = await prisma.forumPost.findMany({
            take: parseInt(limit),
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                images: true,
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                        profileImage: true, // [NEW] Added for Clients
                        stylistProfile: {
                            select: { id: true, businessName: true, profileImage: true, subscription: { select: { planKey: true } } }
                        }
                    }
                },
                _count: { select: { comments: true } },
                // Fetch view for current user to check read status
                ...(req.user ? {
                    postViews: {
                        where: { userId: req.user.id },
                        select: { viewedAt: true }
                    }
                } : {})
            }
        });

        // Compute 'hasNewReply' flag
        const enhancedPosts = posts.map(post => {
            let hasNewReply = false;
            // Only relevant if there are comments
            if (post._count.comments > 0) {
                if (!req.user) {
                    // Guest: Show new if active (has comments)? Or maybe strict: Guests don't see read status.
                    // Request says: "badge is only for users who have not viewed"
                    // Implies Guests (who never view) might see it or not. Let's show it for guests as "Active".
                    hasNewReply = true;
                } else {
                    const lastView = post.postViews?.[0];
                    if (!lastView) {
                        hasNewReply = true; // Never viewed
                    } else {
                        // Check if updated since last view
                        // Note: We updated Post.updatedAt on new comment in commentController
                        hasNewReply = new Date(post.updatedAt) > new Date(lastView.viewedAt);
                    }
                }
            }

            // Clean up internal relation before sending
            const { postViews, ...rest } = post;
            return { ...rest, hasNewReply };
        });

        res.json(enhancedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

const getPostDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await prisma.forumPost.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
            include: {
                images: true,
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                        profileImage: true, // [NEW] Added for Clients
                        stylistProfile: {
                            select: { id: true, businessName: true, profileImage: true, subscription: { select: { planKey: true } } }
                        }
                    }
                }
            }
        });

        // READ TRACKING: Mark as viewed if user is logged in
        if (req.user) {
            await prisma.postView.upsert({
                where: { userId_postId: { userId: req.user.id, postId: id } },
                update: { viewedAt: new Date() },
                create: { userId: req.user.id, postId: id, viewedAt: new Date() }
            });
        }

        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post details' });
    }
};

const updatePostStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    try {
        const post = await prisma.forumPost.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.authorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.forumPost.update({
            where: { id },
            data: { status }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// --- SAFETY ---

const reportPost = async (req, res) => {
    const reporterId = req.user.id;
    const { id } = req.params; // Post ID
    const { reason } = req.body;

    try {
        await prisma.report.create({
            data: {
                reporterId,
                targetType: 'POST',
                forumPostId: id,
                reason
            }
        });
        res.json({ message: 'Report submitted. Thank you for keeping the community safe.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
};


const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // S3 returns 'location', disk returns 'filename' (constructed in middleware)
    const url = req.file.location || `/uploads/${req.file.filename}`;
    res.json({ url });
};

module.exports = {
    createPost,
    getPosts,
    getPostDetails,
    updatePostStatus,
    reportPost,
    uploadImage
};
