const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'StylistProfile';
        `);
        console.log('Columns in "StylistProfile" table:', res.rows);
        pool.end();
    } catch (err) {
        console.error('Error querying columns:', err);
        pool.end();
    }
}

checkColumns();
