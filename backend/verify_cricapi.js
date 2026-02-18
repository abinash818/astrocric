require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.CRICKET_API_KEY;
const API_URL = process.env.CRICKET_API_URL;
const MATCH_ID = '01223c83-6312-48e8-86a4-c43072309fdd'; // Australia vs Sri Lanka

(async () => {
    try {
        console.log(`Checking scorecard for ID: ${MATCH_ID}...`);
        const url = `${API_URL}/match_scorecard?apikey=${API_KEY}&id=${MATCH_ID}`;
        console.log(`URL: ${url}`);

        const response = await axios.get(url);

        console.log('Status:', response.status);
        if (response.data && response.data.data) {
            console.log('Data found!');
            // console.log(JSON.stringify(response.data.data, null, 2));
            console.log('Scorecard Inning Count:', response.data.data.scorecard ? response.data.data.scorecard.length : 0);
        } else {
            console.log('No data found in response.');
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.log('Response Data:', e.response.data);
        }
    }
})();
