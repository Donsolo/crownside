const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors());
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

app.get('/', (req, res) => {
    res.json({ message: 'CrownSide API is running' });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
