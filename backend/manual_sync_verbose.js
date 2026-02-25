const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const cricketApiService = require('./src/services/cricketApiService');


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runSync() {
    try {
        console.log('🔄 Fetching from API...');
        let current = [];
        try {
            current = await cricketApiService.getCurrentMatches();
            console.log(`Received ${current.length} matches from currentMatches.`);
        } catch (e) {
            console.error('Failed to fetch current matches:', e.message);
        }

        let upcoming = [];
        try {
            upcoming = await cricketApiService.getUpcomingMatches();
            console.log(`Received ${upcoming.length} matches from matches.`);
        } catch (e) {
            console.error('Failed to fetch upcoming matches:', e.message);
        }

        const apiMatches = [...upcoming, ...current];
        const uniqueMatches = Array.from(new Map(apiMatches.map(m => [m.id, m])).values());

        console.log(`Found ${uniqueMatches.length} raw matches in API.`);

        let synced = 0;
        let skippedCount = 0;

        for (const apiMatch of uniqueMatches) {
            const isMajor = cricketApiService.isMajorEvent(apiMatch);
            if (!isMajor) {
                console.log(`[Skipping Minor] ${apiMatch.name || apiMatch.id}`);
                skippedCount++;
                continue;
            }

            const matchData = cricketApiService.transformMatchData(apiMatch);
            console.log(`[Syncing] ${matchData.team1} vs ${matchData.team2} (${matchData.match_date})`);

            try {
                const existing = await pool.query('SELECT id FROM matches WHERE api_match_id = $1', [matchData.api_match_id]);

                if (existing.rows.length > 0) {
                    await pool.query(
                        `UPDATE matches 
                         SET team1 = $1, team2 = $2, team1_flag_url = $3, team2_flag_url = $4,
                             match_date = $5, match_type = $6, venue = $7, status = $8,
                             result = $9, team1_score = $10, team2_score = $11, synced_at = NOW()
                         WHERE api_match_id = $12`,
                        [
                            matchData.team1, matchData.team2, matchData.team1_flag_url,
                            matchData.team2_flag_url, matchData.match_date, matchData.match_type,
                            matchData.venue, matchData.status, matchData.result,
                            matchData.team1_score, matchData.team2_score,
                            matchData.api_match_id
                        ]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO matches 
                         (api_match_id, team1, team2, team1_flag_url, team2_flag_url,
                          match_date, match_type, venue, status, result, team1_score, team2_score, synced_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
                        [
                            matchData.api_match_id, matchData.team1, matchData.team2,
                            matchData.team1_flag_url, matchData.team2_flag_url,
                            matchData.match_date, matchData.match_type, matchData.venue,
                            matchData.status, matchData.result,
                            matchData.team1_score, matchData.team2_score
                        ]
                    );
                }
                synced++;
            } catch (dbErr) {
                console.error(`[DB Error] ${apiMatch.name}:`, dbErr.message);
            }
        }
        console.log(`✅ Finished. Synced ${synced}, Skipped ${skippedCount}.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

runSync();
