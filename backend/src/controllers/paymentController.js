const db = require('../config/database');
const phonePeService = require('../services/paymentService');
const ledgerService = require('../services/ledgerService');
const crypto = require('crypto');

// Helper: Velocity Check (Rate Limiting)
const checkVelocity = async (userId) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const res = await db.query(
        "SELECT count(*) FROM payment_orders WHERE user_id = $1 AND created_at > $2",
        [userId, oneHourAgo]
    );
    if (parseInt(res.rows[0].count) >= 5) {
        throw new Error('Transaction velocity limit reached. Please try again after an hour.');
    }
};

// Helper: Settle Ledger Transaction (Hardened)
const settleLedgerTransaction = async (merchantTransactionId, amount) => {
    try {
        // 1. Determine Accounts
        const gatewayRes = await db.query("SELECT id FROM accounts WHERE type = 'GATEWAY_RECEIVABLE' LIMIT 1");
        let gatewayAccountId;
        if (gatewayRes.rows.length === 0) {
            const acc = await ledgerService.createAccount({
                name: 'PhonePe Receivable',
                type: 'GATEWAY_RECEIVABLE',
                nature: 'ASSET'
            });
            gatewayAccountId = acc.id;
        } else {
            gatewayAccountId = gatewayRes.rows[0].id;
        }

        // 2. Find Payment Order
        const orderRes = await db.query(
            "SELECT * FROM payment_orders WHERE merchant_transaction_id = $1",
            [merchantTransactionId]
        );

        if (orderRes.rows.length > 0) {
            const order = orderRes.rows[0];
            if (order.status !== 'SETTLED') {
                const userAccount = await ledgerService.getUserWallet(order.user_id);

                // 3. Post Double-Entry Transaction
                await ledgerService.postTransaction({
                    transactionId: `SETTLE_${merchantTransactionId}`,
                    description: `Wallet Settlement: ${merchantTransactionId}`,
                    referenceType: 'PAYMENT_ORDER',
                    referenceId: order.id,
                    lines: [
                        { accountId: gatewayAccountId, type: 'DEBIT', amount: order.amount }, // Increase Asset (Gateway Owed)
                        { accountId: userAccount.id, type: 'CREDIT', amount: order.amount } // Increase Liability (User Wallet)
                    ]
                });

                // 4. Update Payment Order Status
                await db.query(
                    "UPDATE payment_orders SET status = 'SETTLED', updated_at = NOW() WHERE id = $1",
                    [order.id]
                );
                console.log(`[Ledger] Hardened Settlement Committed: ${merchantTransactionId}`);
            }
        }
    } catch (err) {
        console.warn(`[Ledger] Settlement Failed for ${merchantTransactionId}:`, err.message);
    }
};

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
    let client;
    try {
        const merchantTransactionId = req.body.merchantTransactionId || req.params.merchantTransactionId;

        if (!merchantTransactionId) {
            return res.status(400).json({ error: 'Merchant Transaction ID is required' });
        }

        // 1. Verify with PhonePe API
        const verificationResult = await phonePeService.verifyPayment(merchantTransactionId);

        if (verificationResult.success && verificationResult.state === 'COMPLETED') {

            // 2. Start SQL Transaction (Consolidated)
            client = await db.pool.connect();
            await client.query('BEGIN');

            const orderResult = await client.query(
                'SELECT * FROM payment_orders WHERE merchant_transaction_id = $1 FOR UPDATE',
                [merchantTransactionId]
            );

            if (orderResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = orderResult.rows[0];

            // --- Amount Verification ---
            if (Math.round(verificationResult.amount) !== Math.round(order.amount)) {
                await client.query('ROLLBACK');
                console.error(`[Fraud] Amount Mismatch: Order ${order.amount} vs Gateway ${verificationResult.amount}`);
                return res.status(400).json({ error: 'Transaction amount mismatch' });
            }

            const purchaseResult = await client.query(
                'SELECT * FROM purchases WHERE phonepe_merchant_transaction_id = $1 FOR UPDATE',
                [merchantTransactionId]
            );

            if (purchaseResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Purchase record not found' });
            }

            const transaction = purchaseResult.rows[0];

            if (transaction.payment_status === 'success' || order.status === 'SETTLED') {
                await client.query('COMMIT');
                return res.json({ success: true, message: 'Already processed' });
            }

            // 4. Update Tables (Legacy + Order)
            const idempotencyKey = crypto.createHash('sha256').update(`${verificationResult.transactionId}_COMPLETED`).digest('hex');

            await client.query(
                "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                [verificationResult.transactionId, transaction.id]
            );

            await client.query(
                "UPDATE payment_orders SET status = 'SUCCESS', gateway_id = $1, idempotency_key = $2, updated_at = NOW() WHERE id = $3",
                [verificationResult.transactionId, idempotencyKey, order.id]
            );

            // --- Ledger Settlement (Triggered within code, but Ledger handles its own Transaction) ---
            // Note: Since LedgerService uses its own pool, we still have a small decoupling risk, 
            // but by updating payment_orders status to SETTLED here, we maintain local consistency.
            await settleLedgerTransaction(merchantTransactionId, verificationResult.amount);

            // 5. Lock user row and update balance if needed
            const userResult = await client.query(
                'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
                [transaction.user_id]
            );
            const openingBalance = parseFloat(userResult.rows[0].wallet_balance || 0);
            const amount = parseFloat(transaction.amount);
            const closingBalance = openingBalance + amount;

            // Handle wallet recharge (prediction_id is NULL)
            if (transaction.prediction_id === null) {
                await client.query(
                    'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                    [closingBalance, transaction.user_id]
                );

                await client.query(
                    `INSERT INTO wallet_ledger 
                     (user_id, purchase_id, type, amount, opening_balance, closing_balance, description)
                     VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'Wallet Recharge')`,
                    [transaction.user_id, transaction.id, amount, openingBalance, closingBalance]
                );

                await client.query('COMMIT');
                return res.json({
                    success: true,
                    message: 'Wallet recharged successfully',
                    type: 'WALLET_RECHARGE',
                    newBalance: closingBalance
                });
            }

            // If it's a prediction purchase
            await client.query('COMMIT');

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
            // FAILED
            client = await db.pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(
                    "UPDATE purchases SET payment_status = 'failed' WHERE phonepe_merchant_transaction_id = $1 AND payment_status = 'pending'",
                    [merchantTransactionId]
                );
                await db.query(
                    "UPDATE payment_orders SET status = 'FAILED', updated_at = NOW() WHERE merchant_transaction_id = $1",
                    [merchantTransactionId]
                );
                await client.query('COMMIT');
            } catch (e) { await client.query('ROLLBACK'); }

            res.status(400).json({
                error: 'Payment verification failed',
                code: verificationResult.code
            });
        }
    } catch (error) {
        if (client) { try { await client.query('ROLLBACK'); } catch (e) { } }
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    } finally {
        if (client) client.release();
    }
};

// PhonePe webhook handler
const webhook = async (req, res) => {
    let client;
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
            const mTxnId = decodedResponse.data.merchantTransactionId;

            // 2. Start SQL Transaction (Consolidated)
            client = await db.pool.connect();
            await client.query('BEGIN');

            const orderResult = await client.query(
                'SELECT * FROM payment_orders WHERE merchant_transaction_id = $1 FOR UPDATE',
                [mTxnId]
            );

            if (orderResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.json({ success: true });
            }

            const order = orderResult.rows[0];

            // --- Amount Verification ---
            if (Math.round(decodedResponse.data.amount) !== Math.round(order.amount)) {
                await client.query('ROLLBACK');
                console.error(`[Fraud] Webhook Amount Mismatch: Order ${order.amount} vs Gateway ${decodedResponse.data.amount}`);
                return res.json({ success: true }); // Acknowledge to stop retries, but don't credit
            }

            const purchaseResult = await client.query(
                'SELECT * FROM purchases WHERE phonepe_merchant_transaction_id = $1 FOR UPDATE',
                [mTxnId]
            );

            if (purchaseResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.json({ success: true });
            }

            const transaction = purchaseResult.rows[0];

            if (transaction.payment_status === 'success' || order.status === 'SETTLED') {
                await client.query('COMMIT');
                return res.json({ success: true });
            }

            // Update Statuses
            const idempotencyKey = crypto.createHash('sha256').update(`${decodedResponse.data.transactionId}_COMPLETED`).digest('hex');

            await client.query(
                "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                [decodedResponse.data.transactionId, transaction.id]
            );

            await client.query(
                "UPDATE payment_orders SET status = 'SUCCESS', gateway_id = $1, idempotency_key = $2, updated_at = NOW() WHERE id = $3",
                [decodedResponse.data.transactionId, idempotencyKey, order.id]
            );

            // Trigger Ledger
            await settleLedgerTransaction(mTxnId, decodedResponse.data.amount);

            // Handle balance update (Legacy Users Table)
            // Only if it's a wallet recharge (prediction_id is NULL)
            if (transaction.prediction_id === null) {
                const userResult = await client.query(
                    'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
                    [transaction.user_id]
                );
                const openingBalance = parseFloat(userResult.rows[0].wallet_balance || 0);
                const amount = parseFloat(transaction.amount);
                const closingBalance = openingBalance + amount;

                await client.query(
                    'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                    [closingBalance, transaction.user_id]
                );

                // Immutable Legacy Log
                await client.query(
                    `INSERT INTO wallet_ledger 
                     (user_id, purchase_id, type, amount, opening_balance, closing_balance, description)
                     VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'Wallet Recharge (Webhook)')`,
                    [transaction.user_id, transaction.id, amount, openingBalance, closingBalance]
                );
            }

            await client.query('COMMIT');
        } else {
            // FAILED (Simpler update)
            await db.query(
                "UPDATE purchases SET payment_status = 'failed' WHERE phonepe_merchant_transaction_id = $1 AND payment_status = 'pending'",
                [decodedResponse.data.merchantTransactionId]
            );
            await db.query(
                "UPDATE payment_orders SET status = 'FAILED', updated_at = NOW() WHERE merchant_transaction_id = $1",
                [decodedResponse.data.merchantTransactionId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    } finally {
        if (client) client.release();
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
        const { amount, predictionId, restrictToUpi } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // 1. Ensure User Ledger Account Exists
        let userAccount = await ledgerService.getUserWallet(userId);
        if (!userAccount) {
            userAccount = await ledgerService.createAccount({
                name: `User ${userId} Wallet`,
                type: 'USER_WALLET',
                nature: 'LIABILITY', // We owe this money to the user
                ownerId: userId
            });
        }

        // 2. Generate Transaction ID
        const userIdStr = userId.toString();
        const shortUserId = userIdStr.length > 6 ? userIdStr.slice(-6) : userIdStr;
        const merchantTransactionId = `T${Date.now()}${shortUserId}`;

        // 3. Get user phone
        const userResult = await db.query('SELECT phone FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) throw new Error('User not found');

        // 5. Get Token from PhonePe
        let sdkResponse;
        if (restrictToUpi && req.body.nativeUpi) {
            // Use UPI Intent Flow for Native App Selection
            sdkResponse = await phonePeService.getUpiIntent({
                amount,
                userId,
                merchantTransactionId,
                phone: userResult.rows[0].phone
            });
        } else {
            // Use Standard Web Checkout
            let paymentModeConfig = null;
            if (restrictToUpi) {
                paymentModeConfig = { "enabledPaymentModes": [{ "type": "UPI" }] };
            }
            sdkResponse = await phonePeService.getSdkToken({
                amount,
                userId,
                merchantTransactionId,
                phone: userResult.rows[0].phone,
                paymentModeConfig
            });
        }

        // 6. Create Payment Order (Hardened State Machine)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 Minutes
        await db.query(
            `INSERT INTO payment_orders 
             (merchant_transaction_id, user_id, amount, status, expires_at, created_at)
             VALUES ($1, $2, $3, 'INITIATED', $4, NOW())`,
            [merchantTransactionId, userId, amount * 100, expiresAt] // Store in Paise
        );

        // 7. Maintain Backward Compatibility (Shadow Write to purchases)
        if (predictionId) {
            await db.query(
                `INSERT INTO purchases 
                 (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
                 VALUES ($1, $2, $3, $4, 'pending')`,
                [userId, predictionId, merchantTransactionId, amount]
            );
        } else {
            await db.query(
                `INSERT INTO purchases 
                 (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
                 VALUES ($1, NULL, $2, $3, 'pending')`,
                [userId, merchantTransactionId, amount]
            );
        }

        res.json({
            ...sdkResponse,
            merchantTransactionId
        });
    } catch (error) {
        console.error('Get SDK Token Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate SDK token' });
    }
};

// Check Pending Orders (Reconciliation)
const checkPendingStatus = async (req, res) => {
    try {
        // Support dynamic windows for tiered reconciliation (T+5m, T+30m, T+2h)
        const minutes = req.body.minutes || req.query.minutes || 5;
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

        const result = await db.query(
            `SELECT * FROM purchases 
             WHERE payment_status = 'pending' 
             AND phonepe_merchant_transaction_id IS NOT NULL
             AND created_at < $1
             LIMIT 20`,
            [cutoffTime]
        );

        const updates = [];

        for (const order of result.rows) {
            let client;
            try {
                const status = await phonePeService.verifyPayment(order.phonepe_merchant_transaction_id);

                if (status.success && status.state === 'COMPLETED') {

                    client = await db.pool.connect();
                    await client.query('BEGIN');

                    // 1. Lock and fetch original Order record for Amount Verification
                    const orderResult = await client.query(
                        'SELECT * FROM payment_orders WHERE merchant_transaction_id = $1 FOR UPDATE',
                        [order.phonepe_merchant_transaction_id]
                    );

                    if (orderResult.rows.length === 0) {
                        await client.query('ROLLBACK');
                        continue;
                    }

                    const orderDetail = orderResult.rows[0];

                    // --- Amount Verification ---
                    if (Math.round(status.amount) !== Math.round(orderDetail.amount)) {
                        await client.query('ROLLBACK');
                        console.error(`[Fraud] Recon Amount Mismatch: Order ${orderDetail.amount} vs Gateway ${status.amount}`);
                        continue;
                    }

                    // 2. Lock and re-verify Purchase record idempotency
                    const pResult = await client.query(
                        'SELECT * FROM purchases WHERE id = $1 FOR UPDATE',
                        [order.id]
                    );
                    if (pResult.rows[0].payment_status === 'success' || orderDetail.status === 'SETTLED') {
                        await client.query('ROLLBACK');
                        continue;
                    }

                    // 3. Update Statuses
                    const idempotencyKey = crypto.createHash('sha256').update(`${status.transactionId}_COMPLETED`).digest('hex');

                    await client.query(
                        "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                        [status.transactionId, order.id]
                    );

                    await client.query(
                        "UPDATE payment_orders SET status = 'SUCCESS', gateway_id = $1, idempotency_key = $2, updated_at = NOW() WHERE id = $3",
                        [status.transactionId, idempotencyKey, orderDetail.id]
                    );

                    // --- Ledger Settlement ---
                    await settleLedgerTransaction(order.phonepe_merchant_transaction_id, status.amount);

                    // 4. Handle Legacy Wallet logic
                    if (order.prediction_id === null) {
                        const userResult = await client.query(
                            'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
                            [order.user_id]
                        );
                        const openingBalance = parseFloat(userResult.rows[0].wallet_balance || 0);
                        const amount = parseFloat(order.amount);
                        const closingBalance = openingBalance + amount;

                        await client.query(
                            'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                            [closingBalance, order.user_id]
                        );

                        await client.query(
                            `INSERT INTO wallet_ledger 
                             (user_id, purchase_id, type, amount, opening_balance, closing_balance, description)
                             VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'Wallet Recharge (Reconciliation)')`,
                            [order.user_id, order.id, amount, openingBalance, closingBalance]
                        );
                    }
                    await client.query('COMMIT');
                    updates.push({ id: order.id, status: 'COMPLETED' });
                } else if (status.state === 'FAILED' || status.state === 'EXPIRED') {
                    // Update Status to FAILED
                    await db.query(
                        "UPDATE purchases SET payment_status = 'failed' WHERE id = $1 AND payment_status = 'pending'",
                        [order.id]
                    );
                    await db.query(
                        "UPDATE payment_orders SET status = 'FAILED', updated_at = NOW() WHERE merchant_transaction_id = $1",
                        [order.phonepe_merchant_transaction_id]
                    );
                    updates.push({ id: order.id, status: 'FAILED' });
                }
            } catch (err) {
                if (client) await client.query('ROLLBACK');
                console.error(`Failed to verify/update order ${order.id}:`, err);
            } finally {
                if (client) client.release();
            }
        }

        res.json({ success: true, checked: result.rows.length, updates });
    } catch (error) {
        console.error('Reconciliation error:', error);
        res.status(500).json({ error: 'Reconciliation failed' });
    }
};

// Web Test Recharge (No auth - for direct browser testing)
const rechargeTest = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = 1; // Default test user
        const phone = "9876543210";

        console.log('--- Web Redirect Test Started ---');
        console.log('Amount:', amount);

        const merchantTransactionId = `WTTEST_${Date.now()}`;

        // 1. Create Payment Order (Ledger)
        await db.query(
            `INSERT INTO payment_orders 
             (merchant_transaction_id, user_id, amount, status, created_at)
             VALUES ($1, $2, $3, 'CREATED', NOW())`,
            [merchantTransactionId, userId, amount * 100]
        );

        const paymentData = await phonePeService.getSdkToken({
            amount: parseFloat(amount),
            userId: userId,
            phone: phone,
            merchantTransactionId: merchantTransactionId
        });

        console.log('Redirect URL Generated:', paymentData.redirectUrl);

        res.json({
            success: true,
            merchantTransactionId: paymentData.merchantTransactionId,
            redirectUrl: paymentData.redirectUrl
        });
    } catch (error) {
        console.error('Web recharge test error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Payment Callback (Redirect from PhonePe)
const callback = async (req, res) => {
    try {
        const { merchantTransactionId, transactionId } = req.query;

        console.log('--- Payment Callback Received ---');
        console.log('Merchant Txn ID:', merchantTransactionId);
        console.log('PhonePe Txn ID:', transactionId);

        // Simple HTML response to show status to the user
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Status - Astrocric</title>
                <style>
                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; margin: 0; }
                    .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
                    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
                    .success { color: #22c55e; }
                    .failed { color: #ef4444; }
                    h1 { margin: 0.5rem 0; color: #1f2937; }
                    p { color: #6b7280; font-size: 1.1rem; line-height: 1.5; }
                    .btn { margin-top: 2rem; background: #5f259f; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon success">✅</div>
                    <h1>Payment Successful!</h1>
                    <p>Your transaction has been processed. Your wallet balance will be updated shortly.</p>
                    <p style="font-size: 0.8rem; margin-top: 1rem;">ID: ${merchantTransactionId}</p>
                    <a href="astrocric://payment-success" class="btn">Back to App</a>
                    <p style="margin-top: 1rem;"><a href="/" style="color: #6b7280; text-decoration: none; font-size: 0.8rem;">Back to Home</a></p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('<h1>Something went wrong during redirection</h1>');
    }
};

// Submit Dispute (UTR Support)
const submitDispute = async (req, res) => {
    try {
        const { merchantTransactionId, utrNumber, reason, screenshotUrl } = req.body;
        const userId = req.user.id;

        if (!merchantTransactionId || !utrNumber) {
            return res.status(400).json({ error: 'Merchant Transaction ID and UTR Number are required' });
        }

        const orderRes = await db.query(
            "SELECT id, status FROM payment_orders WHERE merchant_transaction_id = $1 AND user_id = $2",
            [merchantTransactionId, userId]
        );

        if (orderRes.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderRes.rows[0];

        if (order.status === 'SETTLED') {
            return res.status(400).json({ error: 'Order is already settled' });
        }

        // 1. Update Order Status
        await db.query(
            "UPDATE payment_orders SET status = 'DISPUTED', utr_number = $1, dispute_reason = $2 WHERE id = $3",
            [utrNumber, reason || 'Transaction Verification Requested', order.id]
        );

        // 2. Create Dispute Record
        await db.query(
            `INSERT INTO disputes (payment_order_id, user_id, utr_number, screenshot_url, reason)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, userId, utrNumber, screenshotUrl, reason]
        );

        res.json({ success: true, message: 'Dispute submitted. Our team will verify the payment within 24 hours.' });
    } catch (error) {
        console.error('Submit dispute error:', error);
        res.status(500).json({ error: 'Failed to submit dispute' });
    }
};

// Unlock Analysis with Wallet Coins
const unlockAnalysisWithWallet = async (req, res) => {
    let client;
    try {
        const { matchId } = req.body;
        const userId = req.user.id;

        if (!matchId) {
            return res.status(400).json({ error: 'Match ID is required' });
        }

        // 1. Fetch the Prediction details and cost
        const predictionRes = await db.query(
            'SELECT * FROM predictions WHERE match_id = $1 AND is_published = true',
            [matchId]
        );

        if (predictionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        const prediction = predictionRes.rows[0];
        const cost = parseFloat(prediction.price);

        // 2. Check if already purchased
        const existingPurchase = await db.query(
            `SELECT * FROM purchases 
             WHERE user_id = $1 AND prediction_id = $2 AND payment_status = 'success'`,
            [userId, prediction.id]
        );

        if (existingPurchase.rows.length > 0) {
            return res.json({
                success: true,
                message: 'Already unlocked',
                prediction: {
                    id: prediction.id,
                    title: prediction.title,
                    fullPrediction: prediction.full_prediction,
                    predictedWinner: prediction.predicted_winner,
                    confidencePercentage: prediction.confidence_percentage
                }
            });
        }

        // 3. Start Transaction
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 4. Fetch User Wallet Balance
        const userRes = await client.query(
            'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );
        const currentBalance = parseFloat(userRes.rows[0].wallet_balance || 0);

        if (currentBalance < cost) {
            await client.query('ROLLBACK');
            return res.status(402).json({
                error: 'Insufficient Astro Coins',
                currentBalance,
                requiredCost: cost
            });
        }

        const newBalance = currentBalance - cost;

        // 5. Update Wallet
        await client.query(
            'UPDATE users SET wallet_balance = $1 WHERE id = $2',
            [newBalance, userId]
        );

        // 6. Record Purchase
        const purchaseRes = await client.query(
            `INSERT INTO purchases 
             (user_id, prediction_id, phonepe_merchant_transaction_id, amount, payment_status)
             VALUES ($1, $2, $3, $4, 'success') RETURNING id`,
            [userId, prediction.id, `WALLET_${Date.now()}_${userId}`, cost]
        );
        const purchaseId = purchaseRes.rows[0].id;

        // 7. Ledger Entry
        await client.query(
            `INSERT INTO wallet_ledger 
             (user_id, purchase_id, type, amount, opening_balance, closing_balance, description)
             VALUES ($1, $2, 'DEBIT', $3, $4, $5, 'Unlocked Match Analysis')`,
            [userId, purchaseId, cost, currentBalance, newBalance]
        );

        await client.query('COMMIT');

        // 8. Return the uncovered analysis
        res.json({
            success: true,
            message: 'Analysis unlocked successfully',
            newBalance,
            prediction: {
                id: prediction.id,
                title: prediction.title,
                fullPrediction: prediction.full_prediction,
                predictedWinner: prediction.predicted_winner,
                confidencePercentage: prediction.confidence_percentage
            }
        });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Wallet Unlock error:', error);
        res.status(500).json({ error: 'Failed to unlock analysis using wallet' });
    } finally {
        if (client) client.release();
    }
};

// Get user profile including wallet balance
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT id, phone, name, email, wallet_balance FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            walletBalance: parseFloat(user.wallet_balance || 0)
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

module.exports = {
    createOrder,
    rechargeWallet,
    getSdkToken,
    checkPendingStatus,
    verifyPayment,
    webhook,
    getPaymentHistory,
    rechargeTest,
    callback,
    submitDispute,
    unlockAnalysisWithWallet,
    getUserProfile
};
