const mysql = require('mysql2/promise');
require('dotenv').config();

async function getSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [tables] = await connection.query('SHOW TABLES');

        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
            console.log(createTable[0]['Create Table']);
            console.log('\n');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

getSchema();
