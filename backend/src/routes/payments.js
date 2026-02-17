const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create payment order (requires auth)
router.post('/create-order', auth, paymentController.createOrder);

// Verify payment (requires auth)
router.post('/verify', auth, paymentController.verifyPayment);

// PhonePe webhook (no auth - verified by signature)
router.post('/webhook', paymentController.webhook);

// Get payment history (requires auth)
router.get('/history', auth, paymentController.getPaymentHistory);

module.exports = router;
