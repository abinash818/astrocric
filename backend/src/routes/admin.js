const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// All admin routes require admin authentication
router.use(adminController.adminAuth);

// Match management
router.post('/matches/sync', adminController.syncMatches);

// Prediction management
router.post('/predictions', adminController.createPrediction);
router.put('/predictions/:id', adminController.updatePrediction);
router.delete('/predictions/:id', adminController.deletePrediction);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;
