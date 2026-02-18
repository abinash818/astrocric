const axios = require('axios');
const crypto = require('crypto');

const merchantId = 'M23VW0EJ3IVEK';
const saltKey = '07bad376-5933-41d1-9a54-4b926e23e672';
const saltIndex = '1';

const urls = [
    'https://api.phonepe.com/apis/hermes/pg/v1/pay',
    'https://api.phonepe.com/apis/hermes/v1/pay',
    'https://api.phonepe.com/apis/pg/v1/pay',
    'https://api.phonepe.com/apis/v3/pay',
    'https://api.phonepe.com/apis/hermes/v3/pay',
    'https://api.phonepe.com/apis/hermes/standard/v1/pay'
];

async function test(url) {
    const payload = {
        merchantId: merchantId,
        merchantTransactionId: 'TX' + Date.now(),
        merchantUserId: 'USER_61',
        amount: 100,
        callbackUrl: 'https://astrocric.onrender.com/api/payment/webhook',
        mobileNumber: '9999999999',
        paymentInstrument: { type: "PAY_PAGE" }
    };
    const base64Body = Buffer.from(JSON.stringify(payload)).toString('base64');
    const path = new URL(url).pathname.replace('/apis/hermes', '').replace('/apis', '');
    const stringToHash = base64Body + path + saltKey;
    const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + "###" + saltIndex;

    try {
        console.log(`Testing URL: ${url} (Path: ${path})`);
        const response = await axios.post(url, { request: base64Body }, {
            headers: { 'X-VERIFY': checksum, 'Content-Type': 'application/json' }
        });
        console.log(`SUCCESS: ${url} ->`, response.data.code || 'OK');
    } catch (e) {
        console.log(`FAILED: ${url} -> ${e.response ? e.response.status + ' ' + (e.response.data.code || '') : e.message}`);
    }
}

async function run() {
    for (const url of urls) {
        await test(url);
    }
}

run();
