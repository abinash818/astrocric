const axios = require('axios');

const API_URL = 'https://astrocric.onrender.com/api';

async function reproduce() {
    try {
        console.log('1. Logging in...');
        // Send OTP
        await axios.post(`${API_URL}/auth/send-otp`, { phone: '+919876543210' });

        // Verify OTP (Test OTP logic likely applies if using test credentials, or we rely on specific test number)
        // Assuming 1234 is valid for test/dev or we use a known test number if available.
        // If real OTP is needed, this script might fail. But let's try the common test pattern.
        const loginRes = await axios.post(`${API_URL}/auth/verify-otp`, {
            phone: '+919876543210',
            otp: '1234'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        console.log('2. Initiating Recharge...');
        const rechargeRes = await axios.post(
            `${API_URL}/payment/recharge`,
            { amount: 100 },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Success!', rechargeRes.data);

    } catch (error) {
        if (error.response) {
            console.error('FAILED with status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

reproduce();
