require('dotenv').config();
const db = require('./src/config/database');

async function checkSchema() {
    try {
        console.log('Checking users table schema...');
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.table(result.rows);
        process.exit(0);
    } catch (err) {
        console.error('Schema check failed:', err);
        process.exit(1);
    }
}

checkSchema();
