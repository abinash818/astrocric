const db = require('../config/database');
const phonePeService = require('../services/paymentService');

// Create payment order
const createOrder = async (req, res) => {
    try {
        const { predictionId } = req.body;
        const userId = req.user.id;

        // Get prediction details
        const predResult = await db.query(
            'SELECT * FROM predictions WHERE id = $1 AND is_published = true',
            [predictionId]
        );

        if (predResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prediction not found' });
        }

        const prediction = predResult.rows[0];

        // Check if already purchased
        const existingPurchase = await db.query(
            'SELECT * FROM purchases WHERE user_id = $1 AND prediction_id = $2',
            [userId, predictionId]
        );

        if (existingPurchase.rows.length > 0 && existingPurchase.rows[0].payment_status === 'success') {
            return res.status(400).json({ error: 'Prediction already purchased' });
        }

        // Get user phone
        const userResult = await db.query(
            'SELECT phone FROM users WHERE id = $1',
            [userId]
        );

        // Initiate PhonePe payment
        const paymentData = await phonePeService.initiatePayment({
            amount: parseFloat(prediction.price),
            userId: userId,
            predictionId: predictionId,
            phone: userResult.rows[0].phone
        });

        // Save or update pending purchase
        if (existingPurchase.rows.length > 0) {
            await db.query(
                `UPDATE purchases 
         SET phonepe_merchant_transaction_id = $1, amount = $2, payment_status = 'pending'
         WHERE id = $3`,
                [paymentData.merchantTransactionId, prediction.price, existingPurchase.rows[0].id]
            );
        } else {
            await db.query(
                `INSERT INTO purchases 
         (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
         VALUES ($1, $2, $3, $4, 'pending')`,
                [userId, predictionId, paymentData.merchantTransactionId, prediction.price]
            );
        }

        res.json({
            success: true,
            merchantTransactionId: paymentData.merchantTransactionId,
            redirectUrl: paymentData.redirectUrl
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
};

// Verify payment
const verifyPayment = async (req, res) => {
    try {
        const { merchantTransactionId } = req.body;

        // Verify with PhonePe
        const verificationResult = await phonePeService.verifyPayment(merchantTransactionId);

        if (verificationResult.success && verificationResult.state === 'COMPLETED') {
            // Update purchase status
            const purchase = await db.query(
                `UPDATE purchases 
         SET phonepe_transaction_id = $1, payment_status = 'success'
         WHERE phonepe_merchant_transaction_id = $2
         RETURNING *`,
                [verificationResult.transactionId, merchantTransactionId]
            );

            if (purchase.rows.length === 0) {
                return res.status(404).json({ error: 'Purchase not found' });
            }

            // Get full prediction
            const prediction = await db.query(
                'SELECT * FROM predictions WHERE id = $1',
                [purchase.rows[0].prediction_id]
            );

            res.json({
                success: true,
                message: 'Payment verified successfully',
                prediction: {
                    id: prediction.rows[0].id,
                    title: prediction.rows[0].title,
                    fullPrediction: prediction.rows[0].full_prediction,
                    predictedWinner: prediction.rows[0].predicted_winner,
                    confidencePercentage: prediction.rows[0].confidence_percentage
                }
            });
        } else {
            // Update to failed
            await db.query(
                `UPDATE purchases 
         SET payment_status = 'failed'
         WHERE phonepe_merchant_transaction_id = $1`,
                [merchantTransactionId]
            );

            res.status(400).json({
                error: 'Payment verification failed',
                code: verificationResult.code
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
};

// PhonePe webhook handler
const webhook = async (req, res) => {
    try {
        const { response } = req.body;
        const checksum = req.headers['x-verify'];

        // Verify webhook signature
        if (!phonePeService.verifyWebhookSignature(response, checksum)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Decode response
        const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());

        console.log('PhonePe webhook received:', decodedResponse);

        if (decodedResponse.success && decodedResponse.data.state === 'COMPLETED') {
            await db.query(
                `UPDATE purchases 
         SET phonepe_transaction_id = $1, payment_status = 'success'
         WHERE phonepe_merchant_transaction_id = $2`,
                [decodedResponse.data.transactionId, decodedResponse.data.merchantTransactionId]
            );
        } else {
            await db.query(
                `UPDATE purchases 
         SET payment_status = 'failed'
         WHERE phonepe_merchant_transaction_id = $1`,
                [decodedResponse.data.merchantTransactionId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT 
        pu.id, pu.amount, pu.payment_status, pu.created_at,
        p.title as prediction_title,
        m.team1, m.team2
       FROM purchases pu
       JOIN predictions p ON pu.prediction_id = p.id
       JOIN matches m ON p.match_id = m.id
       WHERE pu.user_id = $1
       ORDER BY pu.created_at DESC`,
            [userId]
        );

        const payments = result.rows.map(row => ({
            id: row.id,
            amount: parseFloat(row.amount),
            status: row.payment_status,
            predictionTitle: `${row.team1} vs ${row.team2} - ${row.prediction_title}`,
            createdAt: row.created_at
        }));

        res.json({ payments });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    webhook,
    getPaymentHistory
};
