const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to Neon PostgreSQL...');

        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📝 Running database schema...');
        await pool.query(schema);

        console.log('✅ Database initialized successfully!');
        console.log('📊 Tables created:');
        console.log('   - users');
        console.log('   - matches');
        console.log('   - predictions');
        console.log('   - purchases');
        console.log('   - otps');

    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDatabase();
