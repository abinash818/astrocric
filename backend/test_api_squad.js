const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL || 'https://api.cricapi.com/v1';

async function testApi() {
    try {
        // Use a live or recent match ID if possible, or a static one to test
        const id = '64bd7e32-4b0c-4f87-9908-ef575a18abb7'; // Example ID

        console.log(`Testing with ID: ${id}`);

        console.log('--- match_info ---');
        const infoRes = await axios.get(`${CRICKET_API_URL}/match_info`, {
            params: { apikey: CRICKET_API_KEY, id: id }
        });
        console.log('Info Keys:', Object.keys(infoRes.data));
        if (infoRes.data.data) {
            console.log('Data Keys:', Object.keys(infoRes.data.data));
            if (infoRes.data.data.teamInfo) {
                console.log('TeamInfo:', JSON.stringify(infoRes.data.data.teamInfo, null, 2));
            }
            if (infoRes.data.data.scorecard) {
                console.log('Scorecard found');
            }
        }

        console.log('\n--- match_squad ---');
        try {
            const squadRes = await axios.get(`${CRICKET_API_URL}/match_squad`, {
                params: { apikey: CRICKET_API_KEY, id: id }
            });
            console.log('Squad Keys:', Object.keys(squadRes.data));
            if (squadRes.data.data) {
                console.log('Squad Data Type:', typeof squadRes.data.data);
                if (Array.isArray(squadRes.data.data)) {
                    console.log('Squad Teams Count:', squadRes.data.data.length);
                    squadRes.data.data.forEach(team => {
                        console.log(`Team: ${team.teamName}, Players: ${team.players?.length || 0}`);
                        if (team.players && team.players.length > 0) {
                            console.log('Sample Player:', team.players[0]);
                        }
                    });
                } else {
                    console.log('Squad Data is not an array:', squadRes.data.data);
                }
            }
        } catch (e) {
            console.log('match_squad error:', e.message);
        }

    } catch (e) {
        console.error('Test failed:', e.message);
        if (e.response) console.log('Response Details:', e.response.data);
    }
}

testApi();
