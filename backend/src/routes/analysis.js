const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analysisController = require('../controllers/analysisController');

// Get analysis for a match (requires auth to check purchase status)
router.get('/match/:matchId', auth, analysisController.getAnalysisByMatch);

// Get all purchased analyses
router.get('/purchased', auth, analysisController.getPurchasedAnalyses);

module.exports = router;
