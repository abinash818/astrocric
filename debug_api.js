const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

async function debugAPI() {
    try {
        console.log('Fetching from CricAPI...');
        const response = await axios.get(`${CRICKET_API_URL}/matches`, {
            params: { apikey: CRICKET_API_KEY, offset: 0 }
        });

        const matches = response.data.data;
        console.log(`Received ${matches.length} matches.`);

        const first5 = matches.slice(0, 5);
        first5.forEach(m => {
            console.log(`- ${m.name} | Type: ${m.matchType} | Date: ${m.dateTimeGMT} | Status: ${m.status}`);
        });

    } catch (e) {
        console.error('API Error:', e.message);
    }
}

debugAPI();
