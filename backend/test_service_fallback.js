require('dotenv').config();
const paymentService = require('./src/services/paymentService');

async function testServiceFallback() {
    try {
        console.log('--- Testing Service Fallback (Intent -> SDK) ---');
        const result = await paymentService.getUpiIntent({
            amount: 10,
            userId: 999,
            merchantTransactionId: 'TESTFALLBACK' + Date.now(),
            phone: '9999999999'
        });

        console.log('Service Result:', JSON.stringify(result, null, 2));

        if (result.isWebFallback) {
            console.log('SUCCESS: Service correctly fell back to SDK Web Flow for Standard MID.');
            console.log('URL to open in Mobile:', result.intentUrl);
        } else {
            console.log('WARNING: Service did not use fallback? Result:', result);
        }
    } catch (error) {
        console.error('Service Test Failed:', error.message);
        if (error.response) {
            console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testServiceFallback();
