require('dotenv').config();
const db = require('./src/config/database');

(async () => {
    console.log('Adding score columns to matches table...');
    try {
        await db.query(`
            ALTER TABLE matches 
            ADD COLUMN IF NOT EXISTS team1_score VARCHAR(50),
            ADD COLUMN IF NOT EXISTS team2_score VARCHAR(50);
        `);
        console.log('✅ Score columns added successfully.');
    } catch (e) {
        console.error('❌ Error adding columns:', e);
    }
    process.exit();
})();
