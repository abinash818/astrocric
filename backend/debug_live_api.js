require('dotenv').config();
const cricketApiService = require('./src/services/cricketApiService');

(async () => {
    console.log('Fetching live matches from API...');
    try {
        const matches = await cricketApiService.getCurrentMatches();

        matches.forEach(m => {
            const team1 = m.teams?.[0] || m.teamInfo?.[0]?.name;
            const team2 = m.teams?.[1] || m.teamInfo?.[1]?.name;
            const transformed = cricketApiService.transformMatchData(m);

            console.log(`\nMatch: ${team1} vs ${team2}`);
            console.log('ID:', m.id);
            console.log('API Status:', m.status);
            console.log('Score Object:', JSON.stringify(m.score, null, 2));
            console.log('Transformed Score:', transformed.team1_score, '-', transformed.team2_score);

            if (!transformed.team1_score && !transformed.team2_score) {
                console.log('⚠️ NO SCORE EXTRACTED');
                console.log('Full Match Object:', JSON.stringify(m, null, 2));
            }
        });

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit();
})();
