const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('pg-sdk-node');
require('dotenv').config();

const config = {
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    apiUrl: 'https://api.phonepe.com/apis/hermes'
};

const client = StandardCheckoutClient.getInstance(
    config.clientId,
    config.clientSecret,
    '1',
    Env.PRODUCTION
);

async function test() {
    console.log('--- Testing SDK with Explicit Merchant ID ---');
    const txnId = 'T' + Date.now();

    // Create request
    const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(txnId)
        .amount(100)
        .redirectUrl('https://astrocric.onrender.com/api/payment/callback')
        .message('Test Payment')
        .build();

    // FORCE ADD MERCHANT ID (Hack because builder might miss it)
    request.merchantId = config.merchantId;

    console.log('Request Payload:', JSON.stringify(request, null, 2));

    try {
        const response = await client.pay(request);
        console.log('Success! Redirect URL:', response.redirectUrl);
    } catch (error) {
        console.error('Failure:', error.message);
        if (error.response) console.log(error.response.data);
    }
}

test();
