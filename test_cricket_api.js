const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

async function testSquads() {
    try {
        const id = '72e53cc7-257e-4ad7-bda7-eeb74eb36024';
        const response = await axios.get(`${CRICKET_API_URL}/match_info`, {
            params: {
                apikey: CRICKET_API_KEY,
                id: id
            }
        });

        const data = response.data.data;
        console.log('Match Title:', data.name);
        console.log('Teams:', data.teams);

        // Check for squads
        if (data.bbb) {
            console.log('BBB data present (Ball by Ball)');
        }

        if (data.teamInfo) {
            console.log('Team Info present');
        }

        // Try match_squad endpoint if it exists (hypothetical)
        try {
            const squadRes = await axios.get(`${CRICKET_API_URL}/match_squad`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: id
                }
            });
            console.log('Squad Endpoint Success:', JSON.stringify(squadRes.data, null, 2));
        } catch (e) {
            console.log('Squad Endpoint failed or not exist');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSquads();
