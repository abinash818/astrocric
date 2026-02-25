const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function mock() {
    try {
        console.log('🚀 Mocking England vs Pakistan match to LIVE...');

        const matchData = {
            api_match_id: 'mock-eng-pak-2026',
            team1: 'England',
            team2: 'Pakistan',
            team1_flag_url: 'https://flagcdn.com/w80/gb-eng.png',
            team2_flag_url: 'https://flagcdn.com/w80/pk.png',
            team1_score: '154/4 (18.2 ov)',
            team2_score: 'Yet to bat',
            match_date: new Date('2026-02-24T13:30:00Z'),
            match_type: 't20 world cup',
            venue: 'Pallekele International Cricket Stadium',
            status: 'live',
            result: 'England batting'
        };

        // Check if exists
        const existing = await pool.query('SELECT id FROM matches WHERE api_match_id = $1', [matchData.api_match_id]);

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE matches SET 
                    team1=$1, team2=$2, team1_flag_url=$3, team2_flag_url=$4, 
                    team1_score=$5, team2_score=$6, match_date=$7, status=$8, 
                    result=$9 WHERE api_match_id=$10`,
                [
                    matchData.team1, matchData.team2, matchData.team1_flag_url, matchData.team2_flag_url,
                    matchData.team1_score, matchData.team2_score, matchData.match_date, matchData.status,
                    matchData.result, matchData.api_match_id
                ]
            );
            console.log('✅ Updated existing mock match to LIVE.');
        } else {
            await pool.query(
                `INSERT INTO matches (api_match_id, team1, team2, team1_flag_url, team2_flag_url, team1_score, team2_score, match_date, match_type, venue, status, result)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    matchData.api_match_id, matchData.team1, matchData.team2, matchData.team1_flag_url, matchData.team2_flag_url,
                    matchData.team1_score, matchData.team2_score, matchData.match_date, matchData.match_type,
                    matchData.venue, matchData.status, matchData.result
                ]
            );
            console.log('✅ Inserted new mock match as LIVE.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
mock();
