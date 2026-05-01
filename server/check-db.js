const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Checking existing tables...\n');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables);

        if (tables.length > 0) {
            console.log('\nTable structures:');
            for (const table of tables) {
                const tableName = Object.values(table)[0];
                console.log(`\n--- ${tableName} ---`);
                const [columns] = await connection.query(`DESCRIBE ${tableName}`);
                console.log(columns);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkDatabase();
