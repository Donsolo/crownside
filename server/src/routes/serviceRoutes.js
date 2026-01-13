const express = require('express');
const router = express.Router();
const { addService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole(['STYLIST']), addService);
router.put('/:id', authenticateToken, authorizeRole(['STYLIST']), updateService);
router.delete('/:id', authenticateToken, authorizeRole(['STYLIST']), deleteService);

module.exports = router;
