
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'youtube_notes'
};

(async () => {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // 1. Check and Add 'plan' column
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN plan ENUM('free', 'pro', 'expert') DEFAULT 'free'");
            console.log("Added 'plan' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("'plan' column already exists.");
            else console.error("Error adding 'plan':", e.message);
        }

        // 2. Add 'usage_count'
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN usage_count INT DEFAULT 0");
            console.log("Added 'usage_count' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("'usage_count' column already exists.");
            else console.error("Error adding 'usage_count':", e.message);
        }

        // 3. Add 'last_usage_reset'
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN last_usage_reset DATETIME DEFAULT CURRENT_TIMESTAMP");
            console.log("Added 'last_usage_reset' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("'last_usage_reset' column already exists.");
            else console.error("Error adding 'last_usage_reset':", e.message);
        }

        // 4. Add 'suspended_until'
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN suspended_until DATETIME DEFAULT NULL");
            console.log("Added 'suspended_until' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("'suspended_until' column already exists.");
            else console.error("Error adding 'suspended_until':", e.message);
        }

        // 5. Add 'downloads_count'
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN downloads_count INT DEFAULT 0");
            console.log("Added 'downloads_count' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("'downloads_count' column already exists.");
            else console.error("Error adding 'downloads_count':", e.message);
        }

        // 6. Create 'audit_logs' table
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    action VARCHAR(50),
                    details JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log("Verified 'audit_logs' table.");
        } catch (e) {
            console.error("Error creating 'audit_logs':", e.message);
        }

        console.log("Database migration check complete.");

    } catch (error) {
        console.error("Database Connection failed:", error.message);
    } finally {
        if (connection) await connection.end();
    }
})();
