require('dotenv').config();
const db = require('./src/config/database');

(async () => {
    console.log('Checking live matches scores...');
    try {
        const res = await db.query(
            "SELECT id, team1, team2, status, team1_score, team2_score FROM matches WHERE status = 'live'"
        );
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit();
})();
