const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('Running migration...');
        await connection.query(schema);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate().catch(err => {
    console.error('Unhandled error during migration:', err);
    process.exit(1);
});
