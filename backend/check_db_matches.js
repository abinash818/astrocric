const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDB() {
    try {
        const res = await pool.query("SELECT team1, team2, match_date, status, api_match_id, match_type FROM matches WHERE status = 'upcoming' LIMIT 10");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkDB();
