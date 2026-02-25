const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const cricketApiService = require('./src/services/cricketApiService');

async function test() {
    try {
        console.log('Testing getUpcomingMatches...');
        const upcoming = await cricketApiService.getUpcomingMatches();
        console.log(`Success! Found ${upcoming.length} upcoming matches.`);
        upcoming.slice(0, 5).forEach(m => {
            console.log(`- ${m.name} | Date: ${m.dateTimeGMT}`);
        });
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
