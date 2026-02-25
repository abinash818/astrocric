const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const cricketApiService = require('./src/services/cricketApiService');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runFix() {
    try {
        console.log('🧹 Starting cleanup of minor matches...');
        const result = await pool.query('SELECT * FROM matches');
        const matches = result.rows;

        let deletedCount = 0;
        for (const match of matches) {
            const apiMatchMock = {
                id: match.api_match_id,
                name: `${match.team1} vs ${match.team2}`,
                teams: [match.team1, match.team2],
                matchType: match.match_type
            };

            if (!cricketApiService.isMajorEvent(apiMatchMock)) {
                // Check for predictions
                const predCheck = await pool.query('SELECT id FROM predictions WHERE match_id = $1', [match.id]);
                if (predCheck.rows.length === 0) {
                    await pool.query('DELETE FROM matches WHERE id = $1', [match.id]);
                    deletedCount++;
                    console.log(`[Deleted] ${match.team1} vs ${match.team2}`);
                }
            }
        }
        console.log(`✅ Cleanup finished. Removed ${deletedCount} matches.`);

        console.log('\n🔄 Starting re-sync with fixed date parsing...');
        // We'll just fetch current and upcoming from API and update everything
        const current = await cricketApiService.getCurrentMatches();
        const upcoming = await cricketApiService.getUpcomingMatches();
        const all = [...upcoming, ...current];
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());

        let synced = 0;
        for (const apiMatch of unique) {
            if (cricketApiService.isMajorEvent(apiMatch)) {
                const data = cricketApiService.transformMatchData(apiMatch);

                await pool.query(
                    `UPDATE matches 
                     SET match_date = $1, synced_at = NOW()
                     WHERE api_match_id = $2`,
                    [data.match_date, data.api_match_id]
                );
                synced++;
                console.log(`[Updated Date] ${data.team1} vs ${data.team2} -> ${data.match_date}`);
            }
        }
        console.log(`✅ Sync finished. Updated ${synced} match dates.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

runFix();
