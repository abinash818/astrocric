require('dotenv').config();
const db = require('./src/config/database');

(async () => {
    try {
        const result = await db.query("SELECT id, team1, team2, api_match_id, status, match_type FROM matches ORDER BY match_date DESC LIMIT 20");
        console.table(result.rows);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
