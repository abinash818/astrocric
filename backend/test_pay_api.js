const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const merchantId = 'M23VW0EJ3IVEK';
const saltKey = '07bad376-5933-41d1-9a54-4b926e23e672';
const saltIndex = '1';
const apiUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';

async function testPay() {
    const merchantTransactionId = 'T' + Date.now();
    const payload = {
        merchantId: merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: 'USER_TEST_1',
        amount: 100,
        callbackUrl: 'https://astrocric.onrender.com/api/payment/webhook',
        mobileNumber: '9999999999',
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const base64Body = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Body + "/pg/v1/pay" + saltKey;
    const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + "###" + saltIndex;

    try {
        console.log('Initiating /pg/v1/pay...');
        const response = await axios.post(apiUrl, { request: base64Body }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'accept': 'application/json'
            }
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.error('Error Response:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error('Error:', e.message);
        }
    }
}

testPay();
