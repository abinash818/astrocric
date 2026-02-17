const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const predictionController = require('../controllers/predictionController');

// Get prediction for a match (requires auth to check purchase status)
router.get('/match/:matchId', auth, predictionController.getPredictionByMatch);

// Get all purchased predictions
router.get('/purchased', auth, predictionController.getPurchasedPredictions);

module.exports = router;
