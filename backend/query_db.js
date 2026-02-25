const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query("SELECT team1, team2, match_date, status, match_type FROM matches WHERE team1 LIKE '%Pakistan%' OR team2 LIKE '%Pakistan%' OR team1 LIKE '%England%' OR team2 LIKE '%England%' ORDER BY match_date ASC");
        console.log(`Total Matches found: ${res.rows.length}`);
        res.rows.forEach(m => {
            console.log(`- ${m.team1} vs ${m.team2} | Date: ${m.match_date} | Status: ${m.status} | Type: ${m.match_type}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();
