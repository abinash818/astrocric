const axios = require('axios');
const qs = require('querystring');

const credentials = {
    client_id: 'SU2602141859249444980554',
    client_secret: '07bad376-5933-41d1-9a54-4b926e23e672'
};

async function testToken() {
    console.log('--- Testing PhonePe OAuth Token Generation ---');
    try {
        const response = await axios.post('https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
            qs.stringify({
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                client_version: '1',
                grant_type: 'client_credentials'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        console.log('[SUCCESS] Token generated:', response.data.access_token.slice(0, 20) + '...');
        console.log('Full Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log(`[FAILED] Token generation failed: ${error.response ? error.response.status : error.message}`);
        if (error.response && error.response.data) {
            console.log(`   Response: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

testToken();
