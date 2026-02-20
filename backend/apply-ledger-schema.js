const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runLedgerSchema() {
    console.log('🔌 Connecting to Database...');
    // Create pool using same config as init-db.js
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const schemaPath = path.join(__dirname, 'database', 'ledger_schema.sql');
        console.log(`📖 Reading schema from ${schemaPath}...`);
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚡ Executing Ledger Schema...');
        await pool.query(schema);

        console.log('✅ Ledger Schema applied successfully!');
        console.log('📊 New Tables Created:');
        console.log('   - accounts');
        console.log('   - journal_entries');
        console.log('   - journal_lines');
        console.log('   - payment_orders');

    } catch (error) {
        console.error('❌ Error applying schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runLedgerSchema();
