const express = require('express');
const router = express.Router();
const { getHeroes, updateHero } = require('../controllers/heroController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getHeroes);

const heroUpload = upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
]);

router.put('/:pageKey', authenticateToken, authorizeRole(['ADMIN']), heroUpload, updateHero);

module.exports = router;
