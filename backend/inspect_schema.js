require('dotenv').config();
const db = require('./src/config/database');

(async () => {
    try {
        console.log('--- USERS Table ---');
        const users = await db.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users'");
        console.table(users.rows);

        console.log('\n--- PURCHASES Table ---');
        const purchases = await db.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'purchases'");
        console.table(purchases.rows);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
