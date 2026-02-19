const axios = require('axios');
const crypto = require('crypto');

const config = {
    merchantId: 'M23VW0EJ3IVEK',
    saltKey: '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399', // Default Sandbox Key
    saltIndex: '1'
};

const combinations = [
    { name: 'Prod Hermes V1', host: 'https://api.phonepe.com/apis/hermes', endpoint: '/pg/v1/pay' },
    { name: 'Prod PG V1', host: 'https://api.phonepe.com/apis/pg', endpoint: '/pg/v1/pay' },
    { name: 'Prod Hermes Alt', host: 'https://api.phonepe.com/apis/hermes', endpoint: '/v1/pay' },
    { name: 'Sandbox V1', host: 'https://api-preprod.phonepe.com/apis/pg-sandbox', endpoint: '/pg/v1/pay' }
];

async function runTest() {
    console.log('--- Standard PG Detailed Diagnostic ---');
    for (const combo of combinations) {
        const txnId = 'T' + Date.now();
        const payload = {
            merchantId: config.merchantId,
            merchantTransactionId: txnId,
            merchantUserId: 'USER_1',
            amount: 100,
            redirectUrl: 'https://astrocric.onrender.com/api/payment/callback',
            redirectMode: 'GET',
            callbackUrl: 'https://astrocric.onrender.com/api/payment/webhook',
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const checksum = crypto.createHash('sha256')
            .update(base64Payload + combo.endpoint + config.saltKey)
            .digest('hex') + '###' + config.saltIndex;

        const url = combo.host + combo.endpoint;

        try {
            console.log(`Testing ${combo.name}...`);
            const response = await axios.post(url,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'accept': 'application/json'
                    }
                }
            );
            console.log(`[SUCCESS] ${combo.name}!`);
            console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
            return;
        } catch (error) {
            console.log(`[FAILED] ${combo.name} | Status: ${error.response ? error.response.status : error.message}`);
            if (error.response && error.response.data) {
                console.log(`   Response Body: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}

runTest();
