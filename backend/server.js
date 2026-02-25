const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/matches', require('./src/routes/matches'));
app.use('/api/predictions', require('./src/routes/predictions'));
app.use('/api/payment', require('./src/routes/payments'));
app.use('/api/admin', require('./src/routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test payment page
app.get('/test-pay', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PhonePe Payment Test</title>
        <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
            input { padding: 0.8rem; margin: 1rem 0; width: 100%; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
            button { background: #5f259f; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 1.1rem; }
            button:hover { background: #4a1d7f; }
            .status { margin-top: 1rem; color: #666; font-size: 0.9rem; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1 style="color: #5f259f;">PhonePe Test</h1>
            <p>Enter amount to test redirection</p>
            <input type="number" id="amount" value="100" min="1">
            <button id="payBtn" onclick="testPayment()">Start Payment</button>
            <div id="status" class="status">Click button to initiate</div>
        </div>

        <script>
            async function testPayment() {
                const btn = document.getElementById('payBtn');
                const status = document.getElementById('status');
                const amount = document.getElementById('amount').value;
                
                btn.disabled = true;
                btn.innerText = 'Creating Link...';
                status.innerText = 'Requesting backend...';

                try {
                    const response = await fetch('/api/payment/recharge-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount })
                    });
                    
                    const data = await response.json();
                    
                    if (data.redirectUrl) {
                        status.innerText = 'Success! Redirecting...';
                        setTimeout(() => {
                            window.location.href = data.redirectUrl;
                        }, 500);
                    } else {
                        throw new Error(data.error || 'Failed to get redirect URL');
                    }
                } catch (err) {
                    btn.disabled = false;
                    btn.innerText = 'Start Payment';
                    status.innerHTML = '<span style="color: red;">Error: ' + err.message + '</span>';
                    console.error(err);
                }
            }
        </script>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Astrocric API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);

  // Schedule Payment Reconciliation Job (Every 10 minutes)
  const cron = require('node-cron');
  const paymentController = require('./src/controllers/paymentController');

  // 1. Tier 1: Aggressive Reconcile (T+5m) - Every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Running Tier 1 Reconciliation (T+5m)...');
    try {
      await paymentController.checkPendingStatus({ body: { minutes: 5 } }, { json: () => { }, status: () => ({ json: () => { } }) });
    } catch (e) { console.error('T1 Recon Error:', e.message); }
  });

  // 2. Tier 2: Medium-Term Reconcile (T+30m) - Every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running Tier 2 Reconciliation (T+30m)...');
    try {
      await paymentController.checkPendingStatus({ body: { minutes: 30 } }, { json: () => { }, status: () => ({ json: () => { } }) });
    } catch (e) { console.error('T2 Recon Error:', e.message); }
  });

  // 3. Tier 3: Long-Term Reconcile (T+2h) - Every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running Tier 3 Reconciliation (T+2h)...');
    try {
      await paymentController.checkPendingStatus({ body: { minutes: 120 } }, { json: () => { }, status: () => ({ json: () => { } }) });
    } catch (e) { console.error('T3 Recon Error:', e.message); }
  });
  console.log('⏰ Tiered Reconciliation Jobs scheduled (T+5m, T+30m, T+2h)');

  // 4. Match Sync Job: Sync all matches every 2 minutes
  const adminController = require('./src/controllers/adminController');
  cron.schedule('*/2 * * * *', async () => {
    console.log('🔄 Running Background Match Sync (Every 2m)...');
    try {
      await adminController.performMatchSync();
    } catch (e) { console.error('Match Sync Job Error:', e.message); }
  });
});

module.exports = app;
