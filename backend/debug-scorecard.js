require('dotenv').config();
const axios = require('axios');
const db = require('./src/config/database');

(async () => {
    try {
        console.log('Fetching a live match from DB...');
        const result = await db.query("SELECT * FROM matches WHERE status = 'live' LIMIT 1");

        if (result.rows.length === 0) {
            console.log('No live matches found in DB. Checking finished matches...');
            const result2 = await db.query("SELECT * FROM matches WHERE status = 'finished' LIMIT 1");
            if (result2.rows.length === 0) {
                console.log('No matches found.');
                process.exit();
            }
            const match = result2.rows[0];
            console.log(`Testing with FINISHED match: ${match.team1} vs ${match.team2} (ID: ${match.id})`);
            await testEndpoint(match.id);
        } else {
            const match = result.rows[0];
            console.log(`Testing with LIVE match: ${match.team1} vs ${match.team2} (ID: ${match.id}, API_ID: ${match.api_match_id})`);
            await testEndpoint(match.id);
        }

    } catch (e) {
        console.error('Error:', e);
        process.exit();
    }
})();

async function testEndpoint(matchId) {
    try {
        // const url = `http://localhost:3000/api/matches/${matchId}/scorecard`;
        // const url = `https://astrocric-backend.onrender.com/health`;
        const url = `https://astrocric.onrender.com/api/matches/${matchId}/scorecard`;
        console.log(`Calling ${url}...`);
        const response = await axios.get(url);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    } catch (e) {
        console.error('Endpoint Error:', e.message);
        console.error('Error Code:', e.code);
        if (e.response) {
            console.error('Data:', e.response.data);
            console.error('Status:', e.response.status);
        } else {
            console.error('No response received');
        }
    }
    process.exit();
}
