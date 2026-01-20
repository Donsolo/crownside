const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', blockController.blockUser);
router.post('/unblock', blockController.unblockUser);

module.exports = router;
