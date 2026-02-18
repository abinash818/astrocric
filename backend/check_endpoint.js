const axios = require('axios');

async function checkEndpoint() {
    try {
        console.log('Checking POST https://astrocric.onrender.com/api/payment/recharge...');
        const response = await axios.post('https://astrocric.onrender.com/api/payment/recharge', {});
        console.log('Status:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

checkEndpoint();
