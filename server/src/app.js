const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// CORS Configuration
// CORS Configuration
const allowedOrigins = [
    process.env.APP_URL,
    process.env.CLIENT_URL,
    'https://crownside-lovat.vercel.app', // Explicitly allow production frontend
    'https://thecrownside.com', // Custom Domain
    'https://www.thecrownside.com', // Custom Domain (www)
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                console.error(`CORS Blocked: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
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
