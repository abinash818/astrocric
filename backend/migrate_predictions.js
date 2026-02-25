const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Update predictions table
        console.log('Updating predictions table...');
        await client.query(`
            ALTER TABLE predictions 
            ADD COLUMN IF NOT EXISTS player_prediction_price DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS combo_price DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS key_players JSONB;
        `);

        // 2. Update purchases table
        console.log('Updating purchases table...');
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='purchase_type') THEN
                    ALTER TABLE purchases ADD COLUMN purchase_type VARCHAR(20) DEFAULT 'match';
                END IF;
            END $$;
        `);

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

migrate();
