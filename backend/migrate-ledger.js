const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateLedger() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to PostgreSQL for Ledger Migration...');

        // Read ledger schema file
        const schemaPath = path.join(__dirname, 'database', 'ledger_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Applying Ledger Schema...');
        await pool.query(schema);

        console.log('✅ Ledger Schema applied successfully!');
        console.log('📊 Tables created/verified:');
        console.log('   - accounts');
        console.log('   - journal_entries');
        console.log('   - journal_lines');
        console.log('   - payment_orders');

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrateLedger();
