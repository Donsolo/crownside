const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/request', connectionController.sendRequest);
router.post('/accept', connectionController.acceptRequest);
router.post('/remove', connectionController.removeConnection);
router.get('/', connectionController.getConnections);
router.get('/status/:targetUserId', connectionController.checkStatus);

module.exports = router;
