const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Starting database seeding...');

        // 1. Seed Admin User
        const [admins] = await connection.execute("SELECT * FROM users WHERE email = 'admin@scriptmind.com'");
        if (admins.length === 0) {
            console.log("Seeding Admin User...");
            const hashedAdmin = await bcrypt.hash('admin123', 10);
            await connection.execute(
                "INSERT INTO users (username, email, password, role, plan, billing_cycle, created_at) VALUES (?, ?, ?, 'admin', 'expert', 'yearly', NOW())",
                ['System Admin', 'admin@scriptmind.com', hashedAdmin]
            );
        } else {
            console.log("Admin user already exists. Ensuring org_id is NULL and billing is yearly...");
            await connection.execute("UPDATE users SET org_id = NULL, billing_cycle = 'yearly' WHERE email = 'admin@scriptmind.com'");
        }

        // 2. Seed a Demo User
        const [demoUsers] = await connection.execute("SELECT * FROM users WHERE email = 'demo@example.com'");
        if (demoUsers.length === 0) {
            console.log("Seeding Demo User...");
            const hashedDemo = await bcrypt.hash('demo123', 10);
            await connection.execute(
                "INSERT INTO users (username, email, password, role, plan, created_at) VALUES (?, ?, ?, 'user', 'pro', NOW())",
                ['Demo User', 'demo@example.com', hashedDemo]
            );
        } else {
            console.log("Demo user already exists.");
        }

        // 3. Seed System Settings (Pricing)
        console.log("Synchronizing system settings...");
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        const defaultPricing = {
            pro_monthly: 999,
            pro_quarterly: 2799,
            pro_yearly: 9999,
            pro_features: "100 AI Notes, GPT-4 Models, Flashcards, 1080p Downloads, Priority Support",
            expert_monthly: 2499,
            expert_quarterly: 6999,
            expert_yearly: 24999,
            expert_features: "500 AI Notes, Mindmaps & Diagrams, 4K Downloads, Playlist Access, SSO Integration",
            org_monthly: 14999,
            org_quarterly: 39999,
            org_yearly: 149999,
            org_features: "Unlimited Licenses, LMS Integration, Bulk Onboarding, 99.9% SLA, Custom Branding"
        };

        await connection.execute(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", 
            ['pricing_config', JSON.stringify(defaultPricing)]
        );

        // 4. Seed a Sample Organization
        const [adminUsers] = await connection.execute("SELECT id FROM users WHERE email = 'admin@scriptmind.com'");
        if (adminUsers.length > 0) {
            const adminId = adminUsers[0].id;
            const [orgs] = await connection.execute("SELECT * FROM organizations WHERE owner_id = ?", [adminId]);
            if (orgs.length === 0) {
                console.log("Seeding Sample Organization...");
                await connection.execute(
                    "INSERT INTO organizations (owner_id, name, max_members) VALUES (?, ?, ?)",
                    [adminId, 'ScriptMind Academy', 100]
                );
                const [newOrg] = await connection.execute("SELECT id FROM organizations WHERE owner_id = ?", [adminId]);
                const orgId = newOrg[0].id;

                // Add demo user to the org (Admin stays independent for testing individual plans)
                const [demoUsersUpdated] = await connection.execute("SELECT id FROM users WHERE email = 'demo@example.com'");
                if (demoUsersUpdated.length > 0) {
                    const demoUserId = demoUsersUpdated[0].id;
                    await connection.execute("UPDATE users SET org_id = ? WHERE id = ?", [orgId, demoUserId]);
                    console.log("Demo user added to ScriptMind Academy.");
                }
            }
        }

        // 5. Seed a Sample Note
        const [rows] = await connection.execute("SELECT id FROM users WHERE email = 'demo@example.com'");
        if (rows.length > 0) {
            const userId = rows[0].id;
            const [notes] = await connection.execute("SELECT * FROM notes_history WHERE user_id = ?", [userId]);
            if (notes.length === 0) {
                console.log("Seeding Sample Note...");
                await connection.execute(
                    "INSERT INTO notes_history (user_id, video_id, title, thumbnail, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
                    [
                        userId, 
                        'dQw4w9WgXcQ', 
                        'How to AI - Introduction to Machine Learning', 
                        'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', 
                        '# Introduction to Machine Learning\n\nThis is a sample note generated by ScriptMind AI.\n\n## Key Concepts\n- **Supervised Learning**: Training with labeled data.\n- **Unsupervised Learning**: Finding patterns in unlabeled data.\n- **Neural Networks**: Algorithms inspired by the human brain.'
                    ]
                );
            }
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seed().catch(err => {
    console.error('Unhandled error during seeding:', err);
    process.exit(1);
});
