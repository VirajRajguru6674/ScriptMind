const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Adding billing_cycle column...');
        await connection.execute("ALTER TABLE users ADD COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly'");
        console.log('Column added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Failed to add column:', error);
        }
    } finally {
        await connection.end();
    }
}

run();
