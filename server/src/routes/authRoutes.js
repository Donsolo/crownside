const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Public or protected? Public is safer if token expired
router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, updateMe);

module.exports = router;
