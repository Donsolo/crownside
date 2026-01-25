const express = require('express');
const router = express.Router();
const { getAllUsers, getDashboardStats, getPublicProfile, updateUserRole, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRole, optionalAuth } = require('../middleware/auth');

// Public Profile (Auth optional for block checks/connection status)
router.get('/:userId/public', optionalAuth, getPublicProfile);

// Admin only routes
router.get('/stats', authenticateToken, authorizeRole(['ADMIN']), getDashboardStats);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getAllUsers);
router.put('/:userId/role', authenticateToken, authorizeRole(['ADMIN']), updateUserRole);
router.delete('/:userId', authenticateToken, authorizeRole(['ADMIN']), deleteUser);

module.exports = router;
