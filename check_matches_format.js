const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

async function checkFormat() {
    try {
        const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
            params: {
                apikey: CRICKET_API_KEY,
                offset: 0
            }
        });

        console.log('--- Current Matches (First 3) ---');
        console.log(JSON.stringify(response.data.data.slice(0, 3), null, 2));

        console.log('\n--- Checking for major event keywords ---');
        response.data.data.slice(0, 10).forEach(m => {
            console.log(`Match: ${m.name} | Type: ${m.matchType} | DateGMT: ${m.dateTimeGMT}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkFormat();
