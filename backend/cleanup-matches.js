require('dotenv').config();
const db = require('./src/config/database');
const cricketApiService = require('./src/services/cricketApiService');

async function cleanup() {
    try {
        console.log('Starting cleanup of non-major matches...');

        // Get all upcoming and live matches
        const result = await db.query(
            "SELECT id, team1, team2, match_type, venue, status, api_match_id FROM matches WHERE status IN ('upcoming', 'live')"
        );

        const matches = result.rows;
        console.log(`Found ${matches.length} active matches in DB.`);

        let deletedCount = 0;

        for (const match of matches) {
            // Re-verify against new logic
            // Note: isMajorEvent expects apiMatch object, but we can simulate it or refactor logic
            // To be safe, let's use the teams and match_type

            const apiMatchMock = {
                id: match.api_match_id,
                teams: [match.team1, match.team2],
                matchType: match.match_type,
                name: `${match.team1} vs ${match.team2}`, // Approximating series name
                venue: match.venue
            };

            if (!cricketApiService.isMajorEvent(apiMatchMock)) {
                console.log(`Deleting non-major match: ${match.team1} vs ${match.team2} (${match.match_type})`);
                await db.query('DELETE FROM matches WHERE id = $1', [match.id]);
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} matches.`);
        process.exit(0);
    } catch (error) {
        console.error('Cleanup error:', error);
        process.exit(1);
    }
}

cleanup();
