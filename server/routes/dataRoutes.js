const express = require('express');
const router = express.Router();
const dataExportController = require('../controllers/dataExportController');
const authMiddleware = require('../middleware/authMiddleware');

// Data export routes
router.get('/export', authMiddleware, dataExportController.exportUserData);
router.post('/verify-export', authMiddleware, dataExportController.verifyExportFormat);

module.exports = router;

