require('dotenv').config();
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('pg-sdk-node');

const config = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    env: Env.PRODUCTION
};

async function testSdkIntent() {
    try {
        const client = StandardCheckoutClient.getInstance(
            config.clientId,
            config.clientSecret,
            config.clientVersion,
            config.env
        );

        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId('SDK' + Date.now())
            .amount(100)
            .redirectUrl('https://example.com')
            .message('Debug SDK Intent')
            .build();

        request.merchantId = config.merchantId;

        // Manual Injection
        request.paymentInstrument = {
            type: "UPI_INTENT",
            targetApp: "com.phonepe.app"
        };

        console.log('--- Testing SDK Intent ---');
        const response = await client.pay(request);
        console.log('SDK Response:', JSON.stringify(response, null, 2));

        if (response.redirectUrl) {
            console.log('SUCCESS: Got redirectUrl which might handle Intent');
        }
    } catch (error) {
        console.error('SDK Error:', error.message);
    }
}

testSdkIntent();
