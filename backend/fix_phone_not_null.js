require('dotenv').config();
const db = require('./src/config/database');

async function fixSchema() {
    try {
        console.log('--- Database Migration: Making phone column nullable ---');

        // 1. Check current schema
        const checkResult = await db.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'phone';
        `);

        console.log('Current phone column status:', checkResult.rows[0]);

        // 2. Remove NOT NULL constraint
        console.log('Executing: ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;');
        await db.query('ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;');

        // 3. Verify change
        const verifyResult = await db.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'phone';
        `);

        console.log('Updated phone column status:', verifyResult.rows[0]);
        console.log('✅ Migration successful! Google users can now sync without a phone number.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

fixSchema();
