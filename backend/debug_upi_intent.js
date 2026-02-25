require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const config = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    apiUrl: 'https://api.phonepe.com/apis/pg/v1/pay',
    callbackUrl: 'https://webhook.site/test'
};

async function testUpiIntent() {
    const txnId = 'DEBUG' + Date.now();
    const payload = {
        merchantId: config.merchantId,
        merchantTransactionId: txnId,
        merchantUserId: "DEBUG_USER",
        amount: 100, // 1 INR
        redirectUrl: "https://example.com",
        redirectMode: "POST",
        callbackUrl: config.callbackUrl,
        mobileNumber: "9999999999",
        deviceContext: {
            deviceOS: "ANDROID"
        },
        paymentInstrument: {
            type: "UPI_INTENT"
        }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const apiPath = "/apis/pg/v1/pay";
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

    console.log('--- Testing UPI Intent ---');
    console.log('URL:', options.url);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios(options);
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('SUCCESS! Intent URL:', response.data.data.instrumentResponse?.intentUrl);
        } else {
            console.log('FAILED:', response.data.message);
        }
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
}

testUpiIntent();
