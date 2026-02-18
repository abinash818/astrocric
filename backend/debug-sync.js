require('dotenv').config();
const axios = require('axios');
const db = require('./src/config/database');

const API_KEY = process.env.CRICKET_API_KEY;
const API_URL = process.env.CRICKET_API_URL;

(async () => {
    console.log('--- Debugging Sync Issue ---');
    console.log(`API URL: ${API_URL}`);
    console.log(`API Key: ${API_KEY ? 'Present' : 'Missing'}`);

    // 1. Test DB Connection
    try {
        console.log('Testing DB connection...');
        const res = await db.query('SELECT NOW()');
        console.log('DB Connection Check: SUCCESS', res.rows[0]);
    } catch (e) {
        console.error('DB Connection Check: FAILED', e.message);
    }

    // 2. Test Cricket API
    const urlsToTest = [
        'https://api.cricapi.com/v1',
        'https://api.cricketdata.org/v1',
        'https://api.cricketdata.org/api/v1'
    ];

    for (const baseUrl of urlsToTest) {
        try {
            console.log(`Testing API: ${baseUrl}/currentMatches...`);
            const url = `${baseUrl}/currentMatches?apikey=${API_KEY}&offset=0`;
            const response = await axios.get(url, { timeout: 5000 });
            console.log('API Status:', response.status);
            console.log('API Data Preview:', JSON.stringify(response.data).substring(0, 200));
            console.log('SUCCESS with URL:', baseUrl);
            break;
        } catch (e) {
            console.error(`FAILED with URL ${baseUrl}`);
            if (e.response) {
                console.error('Status:', e.response.status);
            } else {
                console.error('Error:', e.message);
            }
        }
    }

    process.exit();
})();
