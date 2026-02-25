const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const cricketApiService = require('./src/services/cricketApiService');

async function debugSync() {
    try {
        console.log('--- DEBUG START ---');
        console.log('Fetching Current Matches...');
        const current = await cricketApiService.getCurrentMatches();
        console.log(`Current: ${current.length} matches`);

        console.log('Fetching Upcoming Matches...');
        const upcoming = await cricketApiService.getUpcomingMatches();
        console.log(`Upcoming: ${upcoming.length} matches`);

        const all = [...current, ...upcoming];
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
        console.log(`Unique Total: ${unique.length} matches`);

        unique.forEach(m => {
            const isMajor = cricketApiService.isMajorEvent(m);
            const matchName = m.name || `${m.teams?.[0]} vs ${m.teams?.[1]}`;

            // Detailed breakdown for isMajorEvent
            const matchType = (m.matchType || '').toLowerCase();
            const teams = (m.teams || []).map(t => t.toLowerCase());
            const seriesName = (m.name || '').toLowerCase();

            const majorTeams = [
                'india', 'australia', 'england', 'south africa', 'pakistan', 'new zealand',
                'west indies', 'sri lanka', 'bangladesh', 'afghanistan', 'netherlands', 'ireland',
                'zimbabwe', 'scotland', 'united arab emirates', 'nepal', 'usa', 'namibia', 'oman', 'canada'
            ];
            const hasMajorTeam = teams.some(team => majorTeams.some(mt => team.includes(mt)));

            if (isMajor) {
                console.log(`✅ [MAJOR] ${matchName} | Type: ${matchType} | Teams: ${JSON.stringify(m.teams)}`);
            } else if (matchName.toLowerCase().includes('england') || matchName.toLowerCase().includes('pakistan')) {
                console.log(`❌ [REJECTED] ${matchName}`);
                console.log(`   Reason Trace:`);
                console.log(`   - Match Type: ${matchType}`);
                console.log(`   - Teams: ${JSON.stringify(m.teams)}`);
                console.log(`   - Series: ${seriesName}`);
                console.log(`   - Has Major Team: ${hasMajorTeam}`);
                console.log(`   - Logic 1 (Sub-regional/Minor): ${seriesName.includes('sub regional') || seriesName.includes('sub-regional')}`);
            }
        });

        console.log('--- DEBUG END ---');
    } catch (e) {
        console.error('Debug failed:', e);
    }
}

debugSync();
