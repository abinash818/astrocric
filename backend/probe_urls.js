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
    'https://api.phonepe.com',
    'https://api-preprod.phonepe.com/apis/pg-sandbox',
    'https://api-preprod.phonepe.com/apis/hermes'
];

const paths = [
    '/pg/v1/pay',
    '/v1/pay',
    '/pg/v1/pay/page',
    '/api/pg/v1/pay'
];

async function probe() {
    console.log('--- Aggressive URL Probe ---');
    for (const host of hosts) {
        for (const path of paths) {
            const url = host + path;
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
                .update(base64Payload + path + config.saltKey)
                .digest('hex') + '###' + config.saltIndex;

            try {
                process.stdout.write(`V: ${url} ... `);
                const response = await axios.post(url,
                    { request: base64Payload },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-VERIFY': checksum,
                            'accept': 'application/json'
                        },
                        timeout: 5000
                    }
                );
                console.log(`[FOUND!] REDIRECT: ${response.data.data.instrumentResponse.redirectInfo.url}`);
                return;
            } catch (error) {
                if (error.response) {
                    console.log(`[${error.response.status}] ${error.response.data ? error.response.data.code : ''}`);
                } else {
                    console.log(`[ERR] ${error.message}`);
                }
            }
        }
    }
}

probe();
