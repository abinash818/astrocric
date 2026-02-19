const axios = require('axios');
const crypto = require('crypto');

const config = {
    merchantId: 'M23VW0EJ3IVEK',
    saltKey: '07bad376-5933-41d1-9a54-4b926e23e672',
    saltIndex: '1'
};

const hosts = [
    'https://api.phonepe.com/apis/hermes',
    'https://api.phonepe.com/apis/pg',
    'https://api.phonepe.com/apis/pg-sandbox',
    'https://mercury.phonepe.com/apis/pg',
    'https://api.phonepe.com/apis/pg/v1/pay'
];

const endpoints = [
    '/pg/v1/pay',
    '/v1/pay',
    ''
];

async function testEndpoint(host, endpoint) {
    const txnId = 'T' + Date.now();
    const payload = {
        merchantId: config.merchantId,
        merchantTransactionId: txnId,
        merchantUserId: 'USER_1',
        amount: 100, // 1 Rupee
        redirectUrl: 'https://astrocric.onrender.com/api/payment/callback',
        redirectMode: 'GET',
        callbackUrl: 'https://astrocric.onrender.com/api/payment/webhook',
        paymentInstrument: { type: 'PAY_PAGE' }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    // Ensure endpoint starts with / for checksum but handle empty endpoint
    const checksumEndpoint = endpoint || '/';
    const checksum = crypto.createHash('sha256')
        .update(base64Payload + '/pg/v1/pay' + config.saltKey) // Most APIs use /pg/v1/pay for checksum
        .digest('hex') + '###' + config.saltIndex;

    const fullUrl = host.endsWith('/') ? host.slice(0, -1) + endpoint : host + endpoint;

    try {
        const response = await axios.post(fullUrl,
            { request: base64Payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'accept': 'application/json'
                }
            }
        );
        console.log(`[SUCCESS] ${fullUrl} -> Status: ${response.status}`);
        return true;
    } catch (error) {
        console.log(`[FAILED] ${fullUrl} -> Error: ${error.response ? error.response.status : error.message}`);
        if (error.response && error.response.data) {
            console.log(`   Response: ${JSON.stringify(error.response.data).slice(0, 200)}`);
        }
        return false;
    }
}

async function run() {
    console.log('--- Testing PhonePe Endpoints ---');
    for (const host of hosts) {
        for (const endpoint of endpoints) {
            await testEndpoint(host, endpoint);
        }
    }
}

run();
