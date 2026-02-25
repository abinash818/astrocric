const cricketApiService = require('./src/services/cricketApiService');
require('dotenv').config();

async function diagnose() {
    try {
        console.log('Fetching current matches from CricketApiService...');
        const matches = await cricketApiService.getCurrentMatches();

        console.log(`Found ${matches.length} matches.`);

        matches.slice(0, 5).forEach((match, i) => {
            console.log(`\n--- Match ${i + 1} ---`);
            console.log('ID:', match.id);
            console.log('Teams:', match.teams);
            console.log('Status type & value:', typeof match.status, match.status);
            console.log('MatchType type & value:', typeof match.matchType, match.matchType);
            console.log('dateTimeGMT:', match.dateTimeGMT);
        });
    } catch (e) {
        console.error('Diagnosis failed:', e);
    }
}

diagnose();
