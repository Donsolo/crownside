const express = require('express');
const router = express.Router();
const { getAllUsers, getDashboardStats } = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Admin only routes
router.get('/stats', authenticateToken, authorizeRole(['ADMIN']), getDashboardStats);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getAllUsers);

module.exports = router;
