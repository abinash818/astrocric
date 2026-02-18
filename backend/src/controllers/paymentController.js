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

// Create wallet recharge order
const rechargeWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Get user phone
        const userResult = await db.query(
            'SELECT phone FROM users WHERE id = $1',
            [userId]
        );

        // Initiate PhonePe payment
        // We use a dummy predictionId of '0' or distinct prefix for merchantTransactionId
        const merchantTransactionId = `WT_${Date.now()}_${userId}`;

        const paymentData = await phonePeService.initiatePayment({
            amount: parseFloat(amount),
            userId: userId,
            predictionId: 'WALLET', // Special tag for wallet
            phone: userResult.rows[0].phone,
            merchantTransactionId: merchantTransactionId // Pass explicit ID
        });

        // Save pending purchase (using NULL for prediction_id)
        await db.query(
            `INSERT INTO purchases 
         (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
         VALUES ($1, NULL, $2, $3, 'pending')`,
            [userId, paymentData.merchantTransactionId, amount]
        );

        res.json({
            success: true,
            merchantTransactionId: paymentData.merchantTransactionId,
            redirectUrl: paymentData.redirectUrl
        });
    } catch (error) {
        console.error('Recharge wallet error:', error);
        res.status(500).json({ error: 'Failed to initiate recharge' });
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
                return res.status(404).json({ error: 'Transaction not found' });
            }

            const transaction = purchase.rows[0];

            // If it's a wallet recharge (prediction_id is NULL)
            if (transaction.prediction_id === null) {
                // Update user wallet balance
                await db.query(
                    `UPDATE users 
             SET wallet_balance = COALESCE(wallet_balance, 0) + $1 
             WHERE id = $2`,
                    [transaction.amount, transaction.user_id]
                );

                return res.json({
                    success: true,
                    message: 'Wallet recharged successfully',
                    type: 'WALLET_RECHARGE',
                    newBalance: parseFloat(transaction.amount) // This is just the added amount, ideally we fetch new balance
                });
            }

            // If it's a prediction purchase
            const prediction = await db.query(
                'SELECT * FROM predictions WHERE id = $1',
                [transaction.prediction_id]
            );

            res.json({
                success: true,
                message: 'Payment verified successfully',
                type: 'PREDICTION_PURCHASE',
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
            const purchase = await db.query(
                `UPDATE purchases 
         SET phonepe_transaction_id = $1, payment_status = 'success'
         WHERE phonepe_merchant_transaction_id = $2
         RETURNING *`,
                [decodedResponse.data.transactionId, decodedResponse.data.merchantTransactionId]
            );

            // Check if it's a wallet recharge and update balance
            if (purchase.rows.length > 0 && purchase.rows[0].prediction_id === null) {
                await db.query(
                    `UPDATE users 
             SET wallet_balance = COALESCE(wallet_balance, 0) + $1 
             WHERE id = $2`,
                    [purchase.rows[0].amount, purchase.rows[0].user_id]
                );
            }
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

// Get SDK Token for Mobile App
const getSdkToken = async (req, res) => {
    try {
        const { amount, predictionId } = req.body; // Accept predictionId
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate a unique transaction ID (max 35 characters)
        // Format: T<timestamp><last6_of_userId>
        const userIdStr = userId.toString();
        const shortUserId = userIdStr.length > 6 ? userIdStr.slice(-6) : userIdStr;
        const merchantTransactionId = `T${Date.now()}${shortUserId}`;

        // Get user for phone number
        const userResult = await db.query(
            'SELECT phone FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const sdkResponse = await phonePeService.getSdkToken({
            amount,
            userId,
            merchantTransactionId,
            phone: userResult.rows[0].phone
        });

        // Save pending purchase
        if (predictionId) {
            await db.query(
                `INSERT INTO purchases 
                 (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
                 VALUES ($1, $2, $3, $4, 'pending')`,
                [userId, predictionId, merchantTransactionId, amount]
            );
        } else {
            // Wallet recharge
            await db.query(
                `INSERT INTO purchases 
                 (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
                 VALUES ($1, NULL, $2, $3, 'pending')`,
                [userId, merchantTransactionId, amount]
            );
        }

        res.json({
            payload: sdkResponse.payload,
            base64Body: sdkResponse.base64Body,
            checksum: sdkResponse.checksum,
            merchantTransactionId
        });
    } catch (error) {
        console.error('Get SDK Token Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate SDK token' });
    }
};

// Check Pending Orders (Reconciliation)
// Should be called via Cron or Admin API
const checkPendingStatus = async (req, res) => {
    try {
        // Find orders pending for > 5 minutes (or as per need)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const result = await db.query(
            `SELECT * FROM purchases 
             WHERE payment_status = 'pending' 
             AND phonepe_merchant_transaction_id IS NOT NULL
             AND created_at < $1
             LIMIT 10`,
            [fiveMinutesAgo]
        );

        const updates = [];

        for (const order of result.rows) {
            try {
                const status = await phonePeService.verifyPayment(order.phonepe_merchant_transaction_id);

                if (status.success && status.state === 'COMPLETED') {
                    // Update to success
                    await db.query(
                        `UPDATE purchases 
                         SET phonepe_transaction_id = $1, payment_status = 'success'
                         WHERE id = $2`,
                        [status.transactionId, order.id]
                    );

                    // If wallet recharge, credit balance
                    if (order.prediction_id === null) {
                        await db.query(
                            `UPDATE users 
                             SET wallet_balance = COALESCE(wallet_balance, 0) + $1 
                             WHERE id = $2`,
                            [order.amount, order.user_id]
                        );
                    }
                    updates.push({ id: order.id, status: 'COMPLETED' });
                } else if (status.state === 'FAILED') {
                    // Update to failed
                    await db.query(
                        `UPDATE purchases 
                         SET payment_status = 'failed'
                         WHERE id = $1`,
                        [order.id]
                    );
                    updates.push({ id: order.id, status: 'FAILED' });
                }
            } catch (err) {
                console.error(`Failed to verify order ${order.id}:`, err);
            }
        }

        res.json({ success: true, checked: result.rows.length, updates });
    } catch (error) {
        console.error('Reconciliation error:', error);
        res.status(500).json({ error: 'Reconciliation failed' });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    webhook,
    getPaymentHistory,
    rechargeWallet,
    getSdkToken,
    checkPendingStatus
};
