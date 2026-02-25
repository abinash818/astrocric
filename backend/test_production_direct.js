require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

async function testDirectProduction() {
    const config = {
        merchantId: process.env.PHONEPE_MERCHANT_ID,
        saltKey: process.env.PHONEPE_SALT_KEY,
        saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
        apiUrl: 'https://api.phonepe.com/apis/pg/v1/pay',
        callbackUrl: process.env.PHONEPE_CALLBACK_URL,
        redirectUrl: process.env.PHONEPE_REDIRECT_URL
    };

    const txnId = 'PRODTEST' + Date.now();
    const payload = {
        merchantId: config.merchantId,
        merchantTransactionId: txnId,
        merchantUserId: "PROD_USER_1",
        amount: 10000, // 100 INR
        redirectUrl: config.redirectUrl,
        redirectMode: "POST",
        callbackUrl: config.callbackUrl,
        mobileNumber: "9999999999",
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const apiPath = "/pg/v1/pay"; // Standard path for PG v1
    const stringToSign = base64Payload + apiPath + config.saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = sha256 + "###" + config.saltIndex;

    const options = {
        method: 'post',
        url: config.apiUrl,
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data: {
            request: base64Payload
        }
    };

    console.log('--- Testing Direct Production API ---');
    console.log('URL:', options.url);

    try {
        const response = await axios(options);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
}

testDirectProduction();
