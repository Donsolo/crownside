const express = require('express');
const cookieParser = require('cookie-parser');

// ... (existing imports)

// CORS Configuration
const allowedOrigins = [
    process.env.APP_URL,
    process.env.CLIENT_URL,
    'https://crownside-lovat.vercel.app',
    'https://thecrownside.com',
    'https://www.thecrownside.com',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin
        if (!origin) return callback(null, true);

        // Exact match
        if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
        }

        // Subdomain regex match for .thecrownside.com
        // Matches https://*.thecrownside.com
        // Capture group not strictly needed but explicit structure is good
        if (/^https:\/\/([a-z0-9-]+)\.thecrownside\.com$/.test(origin)) {
            return callback(null, origin);
        }

        // Localhost Allow (Dynamic ports if needed)
        if (process.env.NODE_ENV === 'development') {
            return callback(null, origin);
        }

        console.error(`CORS Blocked: Origin ${origin} not allowed.`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/authRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stylists', stylistRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/portfolio', portfolioRoutes);
const heroRoutes = require('./routes/heroRoutes');
app.use('/api/heroes', heroRoutes);
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);
const forumRoutes = require('./routes/forumRoutes');
app.use('/api/forum', forumRoutes);
const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/blocks', require('./routes/blockRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'CrownSide API is running' });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
