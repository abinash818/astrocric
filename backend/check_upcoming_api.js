const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

async function checkUpcoming() {
    try {
        console.log('Fetching from CricAPI...');
        const response = await axios.get(`${CRICKET_API_URL}/matches`, {
            params: { apikey: CRICKET_API_KEY, offset: 0 }
        });

        const matches = response.data.data;
        const now = new Date();
        const next48Val = now.getTime() + (48 * 60 * 60 * 1000);

        console.log(`Current Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

        const upcoming = matches.filter(m => {
            const date = new Date(m.dateTimeGMT + ' GMT');
            return date.getTime() >= now.getTime() && date.getTime() <= next48Val;
        });

        console.log(`Found ${upcoming.length} matches in the next 48 hours.`);

        upcoming.forEach(m => {
            const dateStr = new Date(m.dateTimeGMT + ' GMT').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`- ${m.name} | Type: ${m.matchType} | IST: ${dateStr}`);
        });

    } catch (e) {
        console.error('API Error:', e.message);
    }
}

checkUpcoming();
