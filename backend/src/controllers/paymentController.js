const db = require('../config/database');
const phonePeService = require('../services/paymentService');
const ledgerService = require('../services/ledgerService');

// Helper: Settle Ledger Transaction (Idempotent)
const settleLedgerTransaction = async (merchantTransactionId, amount) => {
    try {
        // 1. Determine Escrow Account
        const escrowRes = await db.query("SELECT id FROM accounts WHERE type = 'PLATFORM_ESCROW' LIMIT 1");
        let escrowAccountId;
        if (escrowRes.rows.length === 0) {
            const acc = await ledgerService.createAccount({
                name: 'Platform Escrow (Gateway)',
                type: 'PLATFORM_ESCROW',
                nature: 'ASSET'
            });
            escrowAccountId = acc.id;
        } else {
            escrowAccountId = escrowRes.rows[0].id;
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
                    transactionId: `LEDGER_${merchantTransactionId}`,
                    description: `Wallet Recharge: ${merchantTransactionId}`,
                    referenceType: 'PAYMENT_ORDER',
                    referenceId: order.id,
                    lines: [
                        { accountId: escrowAccountId, type: 'DEBIT', amount: order.amount }, // Increase Asset (Bank)
                        { accountId: userAccount.id, type: 'CREDIT', amount: order.amount } // Increase Liability (User Wallet)
                    ]
                });

                // 4. Update Payment Order Status
                await db.query(
                    "UPDATE payment_orders SET status = 'SETTLED', updated_at = NOW() WHERE id = $1",
                    [order.id]
                );
                console.log(`[Ledger] Settled Order: ${merchantTransactionId}`);
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

            // --- Ledger Settlement ---
            await settleLedgerTransaction(merchantTransactionId, verificationResult.amount);

            // 2. Start SQL Transaction (Legacy)
            client = await db.pool.connect();
            await client.query('BEGIN');

            const purchaseResult = await client.query(
                'SELECT * FROM purchases WHERE phonepe_merchant_transaction_id = $1 FOR UPDATE',
                [merchantTransactionId]
            );

            if (purchaseResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Transaction not found' });
            }

            const transaction = purchaseResult.rows[0];

            if (transaction.payment_status === 'success') {
                await client.query('COMMIT');
                return res.json({ success: true, message: 'Already processed' });
            }

            // 4. Update purchase status
            await client.query(
                "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                [verificationResult.transactionId, transaction.id]
            );

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

            // --- Ledger Settlement ---
            await settleLedgerTransaction(mTxnId, decodedResponse.data.amount);

            // 2. Legacy Update (Purchases + Users Table)
            client = await db.pool.connect();
            await client.query('BEGIN');

            const purchaseResult = await client.query(
                'SELECT * FROM purchases WHERE phonepe_merchant_transaction_id = $1 FOR UPDATE',
                [mTxnId]
            );

            if (purchaseResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.json({ success: true });
            }

            const transaction = purchaseResult.rows[0];

            if (transaction.payment_status === 'success') {
                await client.query('COMMIT');
                return res.json({ success: true });
            }

            // Update purchases status
            await client.query(
                "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                [decodedResponse.data.transactionId, transaction.id]
            );

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

        // 6. Create Payment Order (Bank-Level State Machine)
        await db.query(
            `INSERT INTO payment_orders 
             (merchant_transaction_id, user_id, amount, status, created_at)
             VALUES ($1, $2, $3, 'CREATED', NOW())`,
            [merchantTransactionId, userId, amount * 100] // Store in Paise
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
            let client;
            try {
                const status = await phonePeService.verifyPayment(order.phonepe_merchant_transaction_id);

                if (status.success && status.state === 'COMPLETED') {

                    // --- Ledger Settlement ---
                    await settleLedgerTransaction(order.phonepe_merchant_transaction_id, status.amount);

                    client = await db.pool.connect();
                    await client.query('BEGIN');

                    // Lock and re-verify idempotency
                    const pResult = await client.query(
                        'SELECT * FROM purchases WHERE id = $1 FOR UPDATE',
                        [order.id]
                    );
                    if (pResult.rows[0].payment_status === 'success') {
                        await client.query('ROLLBACK');
                        continue;
                    }

                    // Update to success
                    await client.query(
                        "UPDATE purchases SET phonepe_transaction_id = $1, payment_status = 'success' WHERE id = $2",
                        [status.transactionId, order.id]
                    );

                    // If wallet recharge, credit balance
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
                } else if (status.state === 'FAILED') {
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

module.exports = {
    createOrder,
    rechargeWallet,
    getSdkToken,
    checkPendingStatus,
    verifyPayment,
    webhook,
    getPaymentHistory,
    rechargeTest,
    callback
};
