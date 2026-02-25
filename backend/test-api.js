const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.CRICKET_API_KEY;
const apiUrl = process.env.CRICKET_API_URL;

async function testApi() {
    try {
        console.log(`Testing Current Matches: ${apiUrl}/currentMatches`);
        const res = await axios.get(`${apiUrl}/currentMatches`, {
            params: { apikey: apiKey, offset: 0 }
        });
        console.log('Current API Response data length:', res.data?.data?.length || 0);

        console.log(`Testing All Matches: ${apiUrl}/matches`);
        const res2 = await axios.get(`${apiUrl}/matches`, {
            params: { apikey: apiKey, offset: 0 }
        });
        console.log('All Matches API Response data length:', res2.data?.data?.length || 0);
        if (res2.data?.data?.length > 0) {
            console.log('First All Match name:', res2.data.data[0].name);
            console.log('First All Match type:', res2.data.data[0].matchType);
            console.log('Total credits used/remaining info:', res2.data.info);
        }
    } catch (e) {
        console.error('API Test Error:', e.message);
    }
}

testApi();
