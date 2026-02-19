const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });
const phonePeService = require('./backend/src/services/paymentService');

async function test() {
    try {
        console.log('--- Starting Direct SDK Token Diagnostic ---');
        console.log('Env PHONEPE_API_URL:', process.env.PHONEPE_API_URL);

        const result = await phonePeService.getSdkToken({
            amount: 1,
            userId: 1,
            merchantTransactionId: 'TEST_' + Date.now(),
            phone: '9876543210'
        });

        console.log('--- Diagnostic Result ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.log('--- Diagnostic Error ---');
        console.error(e.message);
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
