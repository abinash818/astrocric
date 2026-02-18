require('dotenv').config();
const db = require('./src/config/database');

(async () => {
    try {
        console.log('Updating Match 20 (Australia vs Sri Lanka) to LIVE...');
        await db.query("UPDATE matches SET status = 'live' WHERE id = 20");
        console.log('Update complete.');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
