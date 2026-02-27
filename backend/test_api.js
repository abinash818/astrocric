const axios = require('axios');
require('dotenv').config();

const CRICKET_API_KEY = 'f5924cc9-2bc4-46ad-9c40-2991e24e04a5';
const CRICKET_API_URL = 'https://api.cricapi.com/v1';

async function testApi() {
    console.log('Testing Cricket API...');
    try {
        const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
            params: { apikey: CRICKET_API_KEY, offset: 0 }
        });

        console.log('API Status:', response.data.status);
        if (response.data && response.data.data) {
            console.log('Total matches returned:', response.data.data.length);
            response.data.data.forEach(m => {
                console.log(`- [${m.id}] ${m.name} | Type: ${m.matchType} | Started: ${m.matchStarted}`);
            });
        } else {
            console.log('No data field in response:', response.data);
        }
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
    }
}

testApi();
