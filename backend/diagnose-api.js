require('dotenv').config();
const cricketApiService = require('./src/services/cricketApiService');

async function diagnose() {
    try {
        console.log('--- Current Matches ---');
        const current = await cricketApiService.getCurrentMatches();
        console.log(`Found ${current.length} matches in /currentMatches`);
        current.forEach(m => {
            const isMajor = cricketApiService.isMajorEvent(m);
            console.log(`[${isMajor ? 'KEEP' : 'SKIP'}] ${m.name || (m.teams?.[0] + ' vs ' + m.teams?.[1])} (${m.matchType})`);
        });

        console.log('\n--- Upcoming Matches (Top 20) ---');
        const upcoming = await cricketApiService.getUpcomingMatches();
        console.log(`Found ${upcoming.length} matches after internal filter in /matches`);
        upcoming.slice(0, 20).forEach(m => {
            const isMajor = cricketApiService.isMajorEvent(m);
            console.log(`[${isMajor ? 'KEEP' : 'SKIP'}] ${m.name || (m.teams?.[0] + ' vs ' + m.teams?.[1])} (${m.matchType})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
