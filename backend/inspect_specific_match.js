const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const cricketApiService = require('./src/services/cricketApiService');

async function inspectMatch() {
    try {
        const current = await cricketApiService.getCurrentMatches();
        const upcoming = await cricketApiService.getUpcomingMatches();
        const all = [...current, ...upcoming];

        const matches = all.filter(m =>
            (m.name && m.name.toLowerCase().includes('world cup')) ||
            (m.name && m.name.toLowerCase().includes('pakistan'))
        );

        if (matches.length > 0) {
            console.log(`Found ${matches.length} matching entries:`);
            matches.forEach(m => console.log(`- ${m.name} | Type: ${m.matchType} | Status: ${m.status} | ID: ${m.id}`));
        } else {
            console.log('No World Cup or Pakistan matches found in API.');
        }
    } catch (e) {
        console.error(e);
    }
}

inspectMatch();
