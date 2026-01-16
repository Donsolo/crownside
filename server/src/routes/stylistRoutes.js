const express = require('express');
const router = express.Router();
const { listStylists, getStylistById, updateProfile, uploadProfileImage, uploadBannerImage, adminListStylists } = require('../controllers/stylistController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/', listStylists);
router.get('/:id', getStylistById);

// Protected (Stylist only)
router.put('/me', authenticateToken, authorizeRole(['STYLIST']), updateProfile);
router.post('/upload-profile-image', authenticateToken, authorizeRole(['STYLIST']), upload.single('image'), uploadProfileImage);
router.post('/upload-banner-image', authenticateToken, authorizeRole(['STYLIST']), upload.single('image'), uploadBannerImage);

// Admin
router.get('/admin/all', authenticateToken, authorizeRole(['ADMIN']), adminListStylists);

module.exports = router;
