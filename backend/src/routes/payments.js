const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create payment order (requires auth)
router.post('/create-order', auth, paymentController.createOrder);

// Recharge wallet (requires auth)
router.post('/recharge', auth, paymentController.rechargeWallet);

// Get SDK Token (requires auth)
router.post('/sdk-token', auth, paymentController.getSdkToken);

// Trigger Reconciliation (Manual/Cron) - protected
router.post('/reconcile', auth, paymentController.checkPendingStatus);

// Verify payment (requires auth)
router.post('/verify', auth, paymentController.verifyPayment);

// PhonePe webhook (no auth - verified by signature)
router.post('/webhook', paymentController.webhook);

// Web Recharge Test (No auth)
router.post('/recharge-test', paymentController.rechargeTest);

// PhonePe Redirect Callback (No auth)
router.get('/callback', paymentController.callback);
router.post('/callback', paymentController.callback);

module.exports = router;
