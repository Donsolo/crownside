import express from 'express';
import { logVisit, getTrafficStats } from '../controllers/analyticsController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Log a visit (fire & forget)
router.post('/visit', logVisit);

// Admin: Get stats
router.get('/stats', authenticateToken, authorizeRole(['ADMIN']), getTrafficStats);

export default router;
