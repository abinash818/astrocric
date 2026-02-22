const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// All admin routes require admin authentication
router.use(adminController.adminAuth);

// Match management
router.post('/matches/sync', adminController.syncMatches);
router.get('/series', adminController.getSeriesList);
router.post('/series/:id/sync', adminController.syncSeriesMatches);
router.get('/available-matches', adminController.getAvailableMatches);
router.post('/matches/sync/:apiMatchId', adminController.syncSingleMatch);

// Prediction management
router.post('/predictions', adminController.createPrediction);
router.put('/predictions/:id', adminController.updatePrediction);
router.delete('/predictions/:id', adminController.deletePrediction);

// Squad management
router.get('/matches/:id/squad', adminController.getMatchSquad);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;
