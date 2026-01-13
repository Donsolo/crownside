const express = require('express');
const router = express.Router();
const { addPortfolioImage, getPortfolioImages, deletePortfolioImage } = require('../controllers/portfolioController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticateToken, authorizeRole(['STYLIST']), upload.single('image'), addPortfolioImage);
router.get('/stylist/:stylistId', getPortfolioImages); // Public read
router.delete('/:id', authenticateToken, authorizeRole(['STYLIST']), deletePortfolioImage);

module.exports = router;
