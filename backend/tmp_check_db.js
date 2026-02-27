const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));

        for (const table of res.rows) {
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table.table_name]);
            console.log(`\nTable: ${table.table_name}`);
            cols.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listTables();
