const express = require('express');
const router = express.Router();
const { getAllUsers, getDashboardStats, getPublicProfile, updateUserRole } = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Public Profile (Auth required for block checks usually, or optional? Let's use auth for now)
router.get('/:userId/public', authenticateToken, getPublicProfile);

// Admin only routes
router.get('/stats', authenticateToken, authorizeRole(['ADMIN']), getDashboardStats);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getAllUsers);
router.put('/:userId/role', authenticateToken, authorizeRole(['ADMIN']), updateUserRole);

module.exports = router;
