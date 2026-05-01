const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function fix() {
    const config = {
        uri: process.env.DB_URI,
        ssl: { rejectUnauthorized: false }
    };
    
    console.log("📡 Connecting to DB...");
    const connection = await mysql.createConnection(config.uri || {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'defaultdb',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("✅ Connected. Syncing tables...");
        
        // 1. Notifications
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                platform VARCHAR(50) DEFAULT 'system',
                status ENUM('unread', 'read') DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✔ Notifications table checked/created.");

        // 2. notes_history video_url
        const [cols] = await connection.execute("SHOW COLUMNS FROM notes_history LIKE 'video_url'");
        if (cols.length === 0) {
            await connection.execute("ALTER TABLE notes_history ADD COLUMN video_url TEXT DEFAULT NULL AFTER notes");
            console.log("✔ Added video_url to notes_history.");
        }

        // 3. Admin Reset
        const adminPass = await bcrypt.hash('Admin@123', 10);
        await connection.execute('DELETE FROM users WHERE email = "admin@scriptmind.com"');
        await connection.execute(
            'INSERT INTO users (username, email, password, role) VALUES ("Admin", "admin@scriptmind.com", ?, "admin")',
            [adminPass]
        );
        console.log("✔ Admin account reset.");

        console.log("🚀 DB FIX COMPLETED SUCCESSFULLY!");
    } catch (e) {
        console.error("❌ FIX FAILED:", e.message);
    } finally {
        await connection.end();
    }
}

fix();
