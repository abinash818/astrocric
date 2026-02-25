const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

async function checkSquads() {
    try {
        const id = '72e53cc7-257e-4ad7-bda7-eeb74eb36024';

        console.log('--- Checking match_info ---');
        const infoRes = await axios.get(`${CRICKET_API_URL}/match_info`, {
            params: { apikey: CRICKET_API_KEY, id: id }
        });

        const infoData = infoRes.data.data;
        console.log('Keys:', Object.keys(infoData));

        console.log('--- Checking match_squad ---');
        try {
            const squadRes = await axios.get(`${CRICKET_API_URL}/match_squad`, {
                params: { apikey: CRICKET_API_KEY, id: id }
            });
            console.log('Squad Keys:', Object.keys(squadRes.data));
            if (squadRes.data.data) {
                console.log('Squad Data Length:', squadRes.data.data.length);
                console.log('First Squad Item:', squadRes.data.data[0]?.teamName, squadRes.data.data[0]?.players?.length, 'players');
            }
        } catch (e) {
            console.log('match_squad failed:', e.message);
        }

    } catch (e) {
        console.error(e.message);
    }
}

checkSquads();
