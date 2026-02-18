require('dotenv').config();
const cricketApiService = require('./src/services/cricketApiService');

(async () => {
    console.log('Fetching live matches from API...');
    try {
        const matches = await cricketApiService.getCurrentMatches();

        if (matches.length > 0) {
            const match = matches[0]; // Pick first match
            console.log(`Fetching scorecard for match: ${match.name || match.id}`);

            const scorecard = await cricketApiService.getMatchScore(match.id);
            console.log(JSON.stringify(scorecard, null, 2));

            if (!scorecard) {
                console.log("Scorecard is null. Trying another match if available.");
                if (matches.length > 1) {
                    const match2 = matches[1];
                    console.log(`Fetching scorecard for match: ${match2.name || match2.id}`);
                    const scorecard2 = await cricketApiService.getMatchScore(match2.id);
                    console.log(JSON.stringify(scorecard2, null, 2));
                }
            }
        } else {
            console.log("No live matches found.");
        }

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit();
})();
