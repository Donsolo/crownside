const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // In-memory for parsing

// All routes require auth
router.use(authenticateToken);

router.get('/events', calendarController.getCalendarEvents);
router.post('/blockout', calendarController.createBlockout);
router.post('/import', upload.single('file'), calendarController.importData);

router.get('/clients', calendarController.getClients);
router.post('/clients', calendarController.createClient);

module.exports = router;
