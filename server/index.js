const express = require('express');
// Trigger Restart2 
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined
});

const { YoutubeTranscript } = require('youtube-transcript');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const nodemailer = require('nodemailer');

// Helper: Audit Logger
async function logAction(userId, action, details) {
    try {
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())', [userId, action, JSON.stringify(details)]
        );
    } catch (e) {
        console.error("Audit Log Error:", e.message);
    }
}

// Notification Helper
async function sendNotifications(title, message, videoUrl, customRecipient = null) {
    const results = { teams: false, telegram: false, email: false };
    const recipient = customRecipient || process.env.NOTIFICATION_EMAIL_TO;

    // 1. Teams Notification
    if (process.env.TEAMS_WEBHOOK_URL) {
        try {
            await axios.post(process.env.TEAMS_WEBHOOK_URL, {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7",
                "summary": title,
                "sections": [{
                    "activityTitle": title,
                    "activitySubtitle": "Notification Alert",
                    "text": `${message}\n\n[Link](${videoUrl})`
                }]
            });
            results.teams = true;
        } catch (e) { console.error("Teams Notify Error:", e.message); }
    }

    // 2. Telegram Notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
            const telMsg = `*${title}*\n\n${message}\n\n[Link](${videoUrl})`;
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: telMsg,
                parse_mode: 'Markdown'
            });
            results.telegram = true;
        } catch (e) { console.error("Telegram Notify Error:", e.message); }
    }

    // 3. Email (Outlook) Notification
    if (process.env.SMTP_USER && process.env.SMTP_PASS && recipient) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.office365.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
            });

            await transporter.sendMail({
                        from: `"ScriptMind AI" <${process.env.SMTP_USER}>`,
                        to: recipient,
                        subject: title,
                        text: `${message}\n\nLink: ${videoUrl}`,
                        html: `<h3>${title}</h3><p>${message}</p>${videoUrl !== "#" ? `<a href="${videoUrl}">View Link</a>` : ""}`
            });
            results.email = true;
        } catch (e) { console.error("Email Notify Error:", e.message); }
    }

    return results;
}

// Helper: Get Random API Key (Rotation)
// Helper: Execute with Key Rotation (Retry Logic)
const executeWithRotation = async (keyName, operation) => {
    const keys = process.env[keyName + 'S'] ? process.env[keyName + 'S'].split(',') : [process.env[keyName]];
    const validKeys = keys.map(k => k?.trim()).filter(k => k);

    if (validKeys.length === 0) {
        console.error(`[${keyName}] No API keys found! check .env`);
        throw new Error(`No API keys configured for ${keyName}`);
    }

    // Shuffle to distribute load
    for (let i = validKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validKeys[i], validKeys[j]] = [validKeys[j], validKeys[i]];
    }

    let lastError;
    for (const key of validKeys) {
        try {
            return await operation(key);
        } catch (error) {
            lastError = error;
            const status = error.response?.status;

            // Don't retry on 404 (Resource Not Found)
            if (status === 404) throw error;

            console.warn(`[${keyName}] Key starting with ...${key.substring(0, 4)} failed: ${error.message} (${status})`);
        }
    }
    throw lastError || new Error(`All keys for ${keyName} failed.`);
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Allow download to work with query param token if header is missing (for direct links/forms if needed)
    // but here it is a POST with JSON body usually.

    if (!token) return res.status(401).json({ error: 'Authentication required' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const checkAdmin = async (req, res, next) => {
    try {
        const [rows] = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
        if (rows.length > 0 && rows[0].role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Admins only.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error checking role' });
    }
};

const checkPlanLimits = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const [rows] = await pool.execute(`
            SELECT u.plan, u.usage_count, u.last_usage_reset, u.org_id, u.downloads_count,
            o.owner_id as org_owner_id,
            owner.plan as org_plan
            FROM users u
            LEFT JOIN organizations o ON u.org_id = o.id
            LEFT JOIN users owner ON o.owner_id = owner.id
            WHERE u.id = ?
        `, [userId]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        
        // Determine effective plan: either user's own plan, or inherited from org owner
        let effectivePlan = user.plan || 'free';
        if (user.org_id && user.org_plan) {
            effectivePlan = user.org_plan;
        }

        const now = new Date();
        const lastReset = new Date(user.last_usage_reset || 0);

        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            await pool.execute('UPDATE users SET usage_count = 0, last_usage_reset = NOW() WHERE id = ?', [userId]);
            user.usage_count = 0;
        }

        const limits = {
            'free': { notes: 5, downloads: 5 },
            'pro': { notes: 100, downloads: 50 },
            'expert': { notes: 500, downloads: 200 },
            'organization': { notes: 9999, downloads: 9999 }
        };

        const planLimits = limits[effectivePlan] || limits['free'];

        // Attach plan to request
        req.userPlan = effectivePlan;
        req.planLimits = planLimits;

        // Check based on the type of action (default to notes if not specified)
        const actionType = req.headers['x-action-type'] || 'notes';
        
        if (actionType === 'notes' && user.usage_count >= planLimits.notes) {
            return res.status(403).json({ 
                error: `Monthly notes limit reached for ${effectivePlan} plan.`,
                upgrade: true
            });
        }

        if (actionType === 'download' && user.downloads_count >= planLimits.downloads) {
            return res.status(403).json({ 
                error: `Monthly download limit reached for ${effectivePlan} plan.`,
                upgrade: true
            });
        }

        next();
    } catch (error) {
        console.error("Plan Check Error:", error);
        res.status(500).json({ error: 'Failed to check plan limits' });
    }
};

// Ensure DB columns exist (Migration) & Seed Admin
(async () => {
    try {
        // 1. Add Missing Columns to users table
        const usersColumns = [
            { name: 'plan', sql: "ALTER TABLE users ADD COLUMN plan ENUM('free', 'pro', 'expert', 'organization') DEFAULT 'free'" },
            { name: 'org_id', sql: "ALTER TABLE users ADD COLUMN org_id INT DEFAULT NULL" },
            { name: 'usage_count', sql: "ALTER TABLE users ADD COLUMN usage_count INT DEFAULT 0" },
            { name: 'last_usage_reset', sql: "ALTER TABLE users ADD COLUMN last_usage_reset DATETIME DEFAULT CURRENT_TIMESTAMP" },
            { name: 'suspended_until', sql: "ALTER TABLE users ADD COLUMN suspended_until DATETIME DEFAULT NULL" },
            { name: 'downloads_count', sql: "ALTER TABLE users ADD COLUMN downloads_count INT DEFAULT 0" },
            { name: 'theme_mode', sql: "ALTER TABLE users ADD COLUMN theme_mode VARCHAR(20) DEFAULT 'system'" },
            { name: 'theme_variant', sql: "ALTER TABLE users ADD COLUMN theme_variant VARCHAR(20) DEFAULT 'default'" },
            { name: 'billing_cycle', sql: "ALTER TABLE users ADD COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly'" }
        ];

        // Ensure ENUM includes 'organization' if it already exists
        try {
            await pool.execute("ALTER TABLE users MODIFY COLUMN plan ENUM('free', 'pro', 'expert', 'organization') DEFAULT 'free'");
        } catch (e) {
            console.log("Plan enum already updated or failed:", e.message);
        }

        for (const col of usersColumns) {
            try {
                const [cols] = await pool.execute(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
                if (cols.length === 0) {
                    console.log(`Migrating DB: Adding ${col.name} column...`);
                    await pool.execute(col.sql);
                }
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') console.error(`Migration error (${col.name}):`, e.message);
            }
        }

        // Create Organizations Table
        try {
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS organizations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    owner_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    max_members INT DEFAULT 50,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log("Organizations table verified.");
        } catch (e) {
            console.error("Error creating organizations table:", e.message);
        }

        // 2c. Add Personal Information Columns
        const personalInfoColumns = ['full_name', 'bio', 'phone', 'location', 'date_of_birth'];
        for (const col of personalInfoColumns) {
            try {
                const [cols] = await pool.execute(`SHOW COLUMNS FROM users LIKE '${col}'`);
                if (cols.length === 0) {
                    console.log(`Migrating DB: Adding ${col} column...`);
                    if (col === 'bio') {
                        await pool.execute(`ALTER TABLE users ADD COLUMN ${col} TEXT DEFAULT NULL`);
                    } else if (col === 'date_of_birth') {
                        await pool.execute(`ALTER TABLE users ADD COLUMN ${col} DATE DEFAULT NULL`);
                    } else if (col === 'phone') {
                        await pool.execute(`ALTER TABLE users ADD COLUMN ${col} VARCHAR(20) DEFAULT NULL`);
                    } else {
                        await pool.execute(`ALTER TABLE users ADD COLUMN ${col} VARCHAR(100) DEFAULT NULL`);
                    }
                }
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`Error adding ${col}:`, e.message);
                }
            }
        }

        // 2d. Add video_url column to notes_history
        try {
            const [colsVideoUrl] = await pool.execute("SHOW COLUMNS FROM notes_history LIKE 'video_url'");
            if (colsVideoUrl.length === 0) {
                console.log("Migrating DB: Adding video_url column to notes_history...");
                await pool.execute("ALTER TABLE notes_history ADD COLUMN video_url VARCHAR(500) DEFAULT NULL");
            }
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') {
                console.error("Error adding video_url to notes_history:", e.message);
            }
        }

        // 3. Create Audit Logs Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50),
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Seed Admin User
        const [admins] = await pool.execute("SELECT * FROM users WHERE email = 'admin@scriptmind.com'");
        if (admins.length === 0) {
            console.log("Seeding Admin User...");
            const hashed = await bcrypt.hash('admin123', 10);
            await pool.execute(
                "INSERT IGNORE INTO users (username, email, password, role, plan, created_at) VALUES (?, ?, ?, 'admin', 'expert', NOW())",
                ['System Admin', 'admin@scriptmind.com', hashed]
            );
        }

        // 5. Create System Settings Table & Seed Defaults
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Seed Default Pricing if not exists
        const [settings] = await pool.execute("SELECT * FROM system_settings WHERE setting_key = 'pricing_config'");
        if (settings.length === 0) {
            console.log("Seeding Default Pricing...");
            const defaultPricing = {
                pro_monthly: 999,
                pro_quarterly: 2799,
                pro_yearly: 9999,
                expert_monthly: 2499,
                expert_quarterly: 6999,
                expert_yearly: 24999,
                org_monthly: 14999,
                org_yearly: 149999
            };
            await pool.execute("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)", ['pricing_config', JSON.stringify(defaultPricing)]);
        }

    } catch (e) {
        console.error("Migration Error:", e);
    }
})();

// Public Routes
app.get('/api/settings/pricing', async (req, res) => {
    try {
        const rows = await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'pricing_config'");
        let pricing = rows[0].length > 0 ? rows[0][0].setting_value : null;

        if (typeof pricing === 'string') {
            try { pricing = JSON.parse(pricing); } catch (e) { console.error("JSON Parse Error:", e); }
        }

        if (!pricing) {
            pricing = {
                pro_monthly: 999,
                pro_quarterly: 2799,
                pro_yearly: 9999,
                expert_monthly: 2499,
                expert_quarterly: 6999,
                expert_yearly: 24999,
                org_monthly: 14999,
                org_yearly: 149999
            };
        }
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pricing" });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
            [username, email, hashedPassword]
        );
        const token = jwt.sign({ id: result.insertId, email, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: result.insertId, username, email, role: 'user', plan: 'free' } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = users[0];

        // Check Suspension
        if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
            return res.status(403).json({ error: 'Account suspended until ' + new Date(user.suspended_until).toLocaleDateString() });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        // Log Login
        logAction(user.id, 'LOGIN', { ip: req.ip });

        const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, plan: user.plan } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60000); // 10 minutes

        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
            [otp, expires, email]
        );

        // Send OTP via internal helper (which handles Teams and Email)
        const title = "Password Reset Request";
        const message = `Your password reset OTP is: ${otp}. This code expires in 10 minutes.`;
        await sendNotifications(title, message, "#", email);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Forgot Pass Error:", error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()',
            [email, otp]
        );
        if (users.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });
        res.json({ message: 'OTP verified' });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()',
            [email, otp]
        );
        if (users.length === 0) return res.status(400).json({ error: 'Invalid session' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Reset failed' });
    }
});

// User Profile & Preferences
const PLAN_LIMITS = { free: 5, pro: 999999, expert: 999999 };

// Helper function to build AI system prompt based on user preferences
function buildAISystemPrompt(ai_tone = 'educational', ai_detail_level = 'detailed', ai_language = 'en') {
    const toneInstructions = {
        educational: "You are an expert educational assistant. Write in a clear, instructive, and professional manner suitable for learning.",
        casual: "You are a friendly educational assistant. Write in a casual, conversational, and approachable manner.",
        formal: "You are a professional educational assistant. Write in a formal, structured, and academic manner.",
        concise: "You are a concise educational assistant. Write briefly and to the point, focusing only on essential information."
    };

    const detailInstructions = {
        concise: "Extract and organize ALL key points, concepts, and essential information from the entire transcript. Be brief but comprehensive - cover every important topic mentioned. Include all definitions, examples, and explanations that are in the video.",
        balanced: "Extract ALL important points with necessary context, explanations, examples, and practical applications from the transcript. Cover every major topic, concept, and detail discussed. Include step-by-step processes, definitions, examples, and takeaways mentioned in the video.",
        detailed: "Extract EVERY important point, concept, example, explanation, and detail from the transcript. Provide comprehensive, in-depth coverage with full context, examples mentioned, step-by-step explanations discussed, key takeaways, and thorough analysis of ALL topics covered. Include all definitions, analogies, processes, and insights that are explicitly mentioned. Leave no important information behind. For short videos, still provide detailed notes with thorough explanations of each topic covered."
    };

    const languageInstructions = {
        en: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in English. Every single word, sentence, paragraph, and response must be in English. Do not mix any other scripts or languages.',
        hi: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in Hindi using ONLY Devanagari script (हिन्दी). Every single word, sentence, paragraph, and response must be in pure Hindi Devanagari script. DO NOT use English, Chinese, Japanese, or any other script. DO NOT mix scripts. Examples of correct Hindi: "यह एक कंटेनरीकरण प्लेटफ़ॉर्म है", "यह एप्लिकेशन और उनकी निर्भरताओं को एक कंटेनर में रखता है". Use ONLY Devanagari characters (अ-ह, ०-९). If you need technical terms, transliterate them into Devanagari script.',
        mr: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in Marathi using ONLY Devanagari script (मराठी). Every single word, sentence, paragraph, and response must be in pure Marathi Devanagari script. DO NOT use English, Chinese, Japanese, or any other script. DO NOT mix scripts.',
        es: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in Spanish (Español). Every single word, sentence, paragraph, and response must be in Spanish. Do not mix any other languages or scripts.',
        fr: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in French (Français). Every single word, sentence, paragraph, and response must be in French. Do not mix any other languages or scripts.',
        de: 'CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL content EXCLUSIVELY in German (Deutsch). Every single word, sentence, paragraph, and response must be in German. Do not mix any other languages or scripts.'
    };

    const tone = toneInstructions[ai_tone] || toneInstructions.educational;
    const detail = detailInstructions[ai_detail_level] || detailInstructions.detailed;
    const language = languageInstructions[ai_language] || languageInstructions.en;

    // Extra strict instruction for Hindi
    const extraHindiInstruction = ai_language === 'hi' 
        ? '\n\nSTRICT RULE FOR HINDI: Use ONLY Devanagari script characters (अ, आ, इ, ई, उ, ऊ, ऋ, ए, ऐ, ओ, औ, अं, अः, क, ख, ग, घ, ङ, च, छ, ज, झ, ञ, ट, ठ, ड, ढ, ण, त, थ, द, ध, न, प, फ, ब, भ, म, य, र, ल, व, श, ष, स, ह, ०-९). DO NOT use Chinese (封, じ, 込), Japanese, English, or any other script. Every character must be Devanagari. If you see mixed scripts in your output, you have FAILED. Rewrite everything in pure Devanagari Hindi.'
        : '';

    const noteGenerationInstructions = `\n\n⚠️ ABSOLUTE RULE - CONTENT ACCURACY (MOST IMPORTANT):
- You MUST ONLY extract information that is EXPLICITLY stated in the transcript
- DO NOT add ANY information, facts, explanations, context, or details that are NOT in the transcript
- DO NOT speculate, infer, or make assumptions about what the speaker might have meant
- DO NOT add external knowledge, background information, or your own interpretations
- DO NOT expand on topics that aren't fully explained in the transcript
- DO NOT use the video title to guess or infer content - ONLY use what's in the transcript
- If the transcript is short or empty, your notes should reflect that - DO NOT fill with speculation
- If a concept is mentioned but not explained, write ONLY what was said - DO NOT add explanations
- If the transcript says "X is important" but doesn't explain why, write "X is important" - DO NOT add why
- Base EVERYTHING strictly on the transcript words - be 100% faithful to what was actually said
- The transcript is your ONLY source - nothing else, not the title, not your knowledge

NOTE GENERATION REQUIREMENTS:
- Extract and organize ALL information from the transcript (only what's actually there)
- Create a well-structured document with clear sections and subsections
- Include ALL key concepts, explanations, examples, definitions that are EXPLICITLY mentioned
- Use clear hierarchical structure: Main Topics → Subtopics → Key Points
- Organize content logically following the video's flow and structure
- Use proper Markdown formatting: # for main headings, ## for sections, ### for subsections, **bold** for emphasis, bullet points for lists
- Cover every significant topic, concept, and detail that is ACTUALLY discussed in the transcript
- If the transcript is comprehensive, create detailed notes covering all topics
- If the transcript is brief, create notes that accurately reflect the brief content`;

    return `${language}${extraHindiInstruction}\n\n${tone} ${detail}${noteGenerationInstructions}\n\nUse Markdown with clear headings, bullet points, and bold text for emphasis. Remember: ALL output must be in the specified language with NO script mixing. Generate comprehensive, extensive notes that cover ALL content from the transcript.`;
}

// Helper function to clean mixed scripts from Hindi text
function cleanHindiText(text, targetLanguage) {
    if (targetLanguage !== 'hi') return text;
    
    // Remove Chinese, Japanese, Korean characters first
    let cleaned = text.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g, '');
    
    // Define allowed characters: Devanagari, ASCII printable, common punctuation, Markdown, whitespace
    // Devanagari: \u0900-\u097F
    // ASCII printable: \u0020-\u007E (space to tilde)
    // Markdown: # * _ ` [ ] ( ) ! - 
    // Whitespace: \n \r \t
    // Unicode punctuation: \u2000-\u206F (general punctuation)
    
    // Remove any character that is NOT in the allowed set
    // We'll use a simpler approach: keep Devanagari, ASCII, and common Unicode punctuation
    cleaned = cleaned.replace(/[^\u0900-\u097F\u0020-\u007E\n\r\t\u2000-\u206F]/g, '');
    
    return cleaned.trim();
}

app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT u.id, u.username, u.email, u.plan, u.role, u.avatar_url, u.ai_tone, u.ai_detail_level, u.ai_language,
             u.usage_count, u.downloads_count, u.created_at, u.theme_mode, u.theme_variant, u.billing_cycle,
             u.full_name, u.bio, u.phone, u.location, u.date_of_birth, u.org_id,
             o.name as org_name,
             (SELECT COUNT(*) FROM notes_history WHERE user_id = u.id) as total_notes
             FROM users u
             LEFT JOIN organizations o ON u.org_id = o.id
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        const u = rows[0];
        u.usage_limit = PLAN_LIMITS[u.plan] ?? PLAN_LIMITS.free;
        res.json(u);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
        const { ai_tone, ai_detail_level, ai_language } = req.body;
        const updates = [];
        const values = [];
        if (ai_tone != null && ['educational', 'casual', 'formal', 'concise'].includes(ai_tone)) {
            updates.push('ai_tone = ?');
            values.push(ai_tone);
        }
        if (ai_detail_level != null && ['concise', 'balanced', 'detailed'].includes(ai_detail_level)) {
            updates.push('ai_detail_level = ?');
            values.push(ai_detail_level);
        }
        if (ai_language != null && ['en', 'es', 'fr', 'de', 'hi', 'mr'].includes(ai_language)) {
            updates.push('ai_language = ?');
            values.push(ai_language);
        }
        if (updates.length === 0) return res.status(400).json({ error: 'No valid preferences to update' });
        values.push(req.user.id);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/user/appearance', authenticateToken, async (req, res) => {
    try {
        const { theme_mode, theme_variant } = req.body;
        const validModes = ['light', 'dark', 'system'];
        const validVariants = ['default', 'forest', 'sunset', 'ocean', 'golden'];
        const mode = validModes.includes(theme_mode) ? theme_mode : null;
        const varVal = validVariants.includes(theme_variant) ? theme_variant : null;
        if (!mode && !varVal) return res.status(400).json({ error: 'No valid appearance settings to update' });

        const updates = [];
        const values = [];
        if (mode) { updates.push('theme_mode = ?'); values.push(mode); }
        if (varVal) { updates.push('theme_variant = ?'); values.push(varVal); }
        values.push(req.user.id);

        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        logAction(req.user.id, 'APPEARANCE_SAVED', { theme_mode: mode || undefined, theme_variant: varVal || undefined });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Organization Management Endpoints ---

app.get('/api/organization', authenticateToken, async (req, res) => {
    try {
        // Get org if owner OR member
        const [orgs] = await pool.execute(
            `SELECT o.*, u.username as owner_name 
             FROM organizations o 
             JOIN users u ON o.owner_id = u.id
             WHERE o.owner_id = ? OR o.id = (SELECT org_id FROM users WHERE id = ?)`,
            [req.user.id, req.user.id]
        );
        if (orgs.length === 0) return res.status(404).json({ error: 'No organization found' });
        res.json(orgs[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/organization', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Organization name is required' });

        const [userRows] = await pool.execute('SELECT plan FROM users WHERE id = ?', [req.user.id]);
        if (userRows[0].plan !== 'organization') {
            return res.status(403).json({ error: 'You need an Organization plan to create an organization' });
        }

        // Check if already owns an org
        const [existing] = await pool.execute('SELECT id FROM organizations WHERE owner_id = ?', [req.user.id]);
        if (existing.length > 0) return res.status(400).json({ error: 'You already own an organization' });

        const [result] = await pool.execute('INSERT INTO organizations (owner_id, name) VALUES (?, ?)', [req.user.id, name]);
        const orgId = result.insertId;

        // Auto-join own org
        await pool.execute('UPDATE users SET org_id = ? WHERE id = ?', [orgId, req.user.id]);

        res.json({ id: orgId, name, message: 'Organization created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/organization/members', authenticateToken, async (req, res) => {
    try {
        // Find org where user is owner or member
        const [userRows] = await pool.execute('SELECT org_id FROM users WHERE id = ?', [req.user.id]);
        const [ownedOrgs] = await pool.execute('SELECT id FROM organizations WHERE owner_id = ?', [req.user.id]);
        
        const orgId = ownedOrgs.length > 0 ? ownedOrgs[0].id : userRows[0].org_id;
        
        if (!orgId) return res.status(404).json({ error: 'No organization found' });

        const [members] = await pool.execute(
            'SELECT id, username, email, avatar_url, role, plan FROM users WHERE org_id = ?', 
            [orgId]
        );
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/organization/members', authenticateToken, async (req, res) => {
    try {
        const { email, plan } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        
        const targetPlan = (plan === 'expert' || plan === 'pro') ? plan : 'pro';

        const [orgs] = await pool.execute('SELECT id, max_members FROM organizations WHERE owner_id = ?', [req.user.id]);
        if (orgs.length === 0) return res.status(403).json({ error: 'Only organization owners can add members' });
        const org = orgs[0];

        const [count] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE org_id = ?', [org.id]);
        if (count[0].total >= org.max_members) return res.status(400).json({ error: 'Member limit reached' });

        const [targetUser] = await pool.execute('SELECT id, org_id FROM users WHERE email = ?', [email]);
        if (targetUser.length === 0) return res.status(404).json({ error: 'User with this email not found' });
        if (targetUser[0].org_id) return res.status(400).json({ error: 'User is already part of an organization' });

        await pool.execute('UPDATE users SET org_id = ?, plan = ? WHERE id = ?', [org.id, targetPlan, targetUser[0].id]);
        res.json({ message: `Member added successfully as ${targetPlan}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/organization/members/:memberId', authenticateToken, async (req, res) => {
    try {
        const { memberId } = req.params;
        const [orgs] = await pool.execute('SELECT id FROM organizations WHERE owner_id = ?', [req.user.id]);
        if (orgs.length === 0) return res.status(403).json({ error: 'Only organization owners can remove members' });
        
        if (parseInt(memberId) === req.user.id) return res.status(400).json({ error: 'Owner cannot remove themselves from their own organization' });

        await pool.execute('UPDATE users SET org_id = NULL WHERE id = ? AND org_id = ?', [memberId, orgs[0].id]);
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/organization/members/:memberId', authenticateToken, async (req, res) => {
    try {
        const { memberId } = req.params;
        const { plan } = req.body;
        if (!plan || !['pro', 'expert'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const [orgs] = await pool.execute('SELECT id FROM organizations WHERE owner_id = ?', [req.user.id]);
        if (orgs.length === 0) return res.status(403).json({ error: 'Only organization owners can update members' });
        const orgId = orgs[0].id;

        const [result] = await pool.execute(
            'UPDATE users SET plan = ? WHERE id = ? AND org_id = ?',
            [plan, memberId, orgId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Member not found in your organization' });
        }

        res.json({ message: 'Member subscription updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, avatar_url, full_name, bio, phone, location, date_of_birth } = req.body;
        const updates = [];
        const values = [];

        if (username != null && username.trim() !== '') {
            // Check if username already exists (excluding current user)
            const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.push('username = ?');
            values.push(username.trim());
        }

        if (email != null && email.trim() !== '') {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Check if email already exists (excluding current user)
            const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            updates.push('email = ?');
            values.push(email.trim());
        }

        if (avatar_url != null) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }

        // Personal information fields
        if (full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(full_name && full_name.trim() !== '' ? full_name.trim() : null);
        }

        if (bio !== undefined) {
            updates.push('bio = ?');
            values.push(bio && bio.trim() !== '' ? bio.trim() : null);
        }

        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone && phone.trim() !== '' ? phone.trim() : null);
        }

        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location && location.trim() !== '' ? location.trim() : null);
        }

        if (date_of_birth !== undefined) {
            updates.push('date_of_birth = ?');
            values.push(date_of_birth && date_of_birth.trim() !== '' ? date_of_birth : null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid profile fields to update' });
        }

        values.push(req.user.id);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Fetch updated user data
        const [rows] = await pool.execute(
            `SELECT id, username, email, plan, role, avatar_url, full_name, bio, phone, location, date_of_birth FROM users WHERE id = ?`,
            [req.user.id]
        );

        logAction(req.user.id, 'PROFILE_UPDATED', { 
            username: username || undefined, 
            email: email || undefined, 
            avatar_updated: !!avatar_url,
            personal_info_updated: !!(full_name !== undefined || bio !== undefined || phone !== undefined || location !== undefined || date_of_birth !== undefined)
        });
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Routes

// Get Detailed Users Stats
app.get('/api/admin/users', authenticateToken, checkAdmin, async (req, res) => {
    try {
        // Join with notes_history count if we wanted exact count, but usage_count handles monthly limit.
        // We will fetch total notes count per user.
        const query = `
            SELECT 
                u.id, u.username, u.email, u.plan, u.role, u.usage_count, u.downloads_count, u.suspended_until, u.created_at,
                (SELECT COUNT(*) FROM notes_history WHERE user_id = u.id) as total_notes
            FROM users u 
            ORDER BY u.created_at DESC
        `;
        const [users] = await pool.execute(query);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/users/:id', authenticateToken, checkAdmin, async (req, res) => {
    const { plan, role } = req.body;
    try {
        await pool.execute('UPDATE users SET plan = ?, role = ? WHERE id = ?', [plan, role, req.params.id]);
        logAction(req.user.id, 'UPDATE_USER', { targetId: req.params.id, plan, role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Pricing
app.put('/api/admin/settings/pricing', authenticateToken, checkAdmin, async (req, res) => {
    const { pro_monthly, pro_yearly, expert_monthly, expert_yearly } = req.body;
    try {
        const newPricing = { pro_monthly, pro_yearly, expert_monthly, expert_yearly };
        await pool.execute(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES ('pricing_config', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [JSON.stringify(newPricing), JSON.stringify(newPricing)]
        );
        logAction(req.user.id, 'UPDATE_PRICING', newPricing);
        res.json({ success: true, pricing: newPricing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Suspend/Unsuspend User
app.post('/api/admin/users/:id/suspend', authenticateToken, checkAdmin, async (req, res) => {
    const { suspendedUntil } = req.body; // Pass NULL to unsuspend
    try {
        await pool.execute('UPDATE users SET suspended_until = ? WHERE id = ?', [suspendedUntil, req.params.id]);
        logAction(req.user.id, suspendedUntil ? 'SUSPEND_USER' : 'UNSUSPEND_USER', { targetId: req.params.id, suspendedUntil });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Audit Logs
app.get('/api/admin/audit-logs', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const [logs] = await pool.execute(`
            SELECT a.*, u.username, u.email 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 100
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        let googleUser = {};

        // Try to verify as ID Token first (standard flow)
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            googleUser = {
                googleId: payload.sub,
                email: payload.email,
                username: payload.name,
                avatar_url: payload.picture
            };
        } catch (idTokenError) {
            // If ID Token verification fails, assume it is an Access Token (implicit flow)
            // Fetch use info from Google API
            try {
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                googleUser = {
                    googleId: response.data.sub,
                    email: response.data.email,
                    username: response.data.name,
                    avatar_url: response.data.picture
                };
            } catch (accessTokenError) {
                console.error("Access Token Verification Failed:", accessTokenError.message);
                throw new Error("Invalid Google Token");
            }
        }

        const { googleId, email, username, avatar_url } = googleUser;

        // Check if user exists by google_id or email
        let [users] = await pool.execute('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
        let user;

        if (users.length === 0) {
            // Create user - Handle duplicate username error
            let finalUsername = username;
            try {
                const [result] = await pool.execute(
                    'INSERT INTO users (username, email, google_id, password, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                    [finalUsername, email, googleId, 'GOOGLE_AUTH_' + Math.random(), avatar_url]
                );
                user = { id: result.insertId, username: finalUsername, email, avatar_url };
            } catch (insertError) {
                if (insertError.code === 'ER_DUP_ENTRY' && insertError.sqlMessage.includes('username')) {
                    // Try again with a modified username
                    finalUsername = `${username}_${Math.floor(Math.random() * 10000)}`;
                    const [result] = await pool.execute(
                        'INSERT INTO users (username, email, google_id, password, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                        [finalUsername, email, googleId, 'GOOGLE_AUTH_' + Math.random(), avatar_url]
                    );
                    user = { id: result.insertId, username: finalUsername, email, avatar_url };
                } else {
                    throw insertError;
                }
            }
        } else {
            user = users[0];
            // Update google_id if it was missing
            if (!user.google_id) {
                await pool.execute('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?', [googleId, avatar_url, user.id]);
            }
            // Refresh user object to ensure we have latest role/plan
            const [updatedUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [user.id]);
            user = updatedUser[0];
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, plan: user.plan, avatar_url: user.avatar_url } });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: 'Google login failed' });
    }
});

app.post('/api/auth/github', async (req, res) => {
    const { code, redirectUri } = req.body;
    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri
        }, {
            headers: { Accept: 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            console.error("GitHub Token Exchange Failed:", tokenResponse.data);
            throw new Error('Failed to get GitHub access token');
        }
        console.log(`GitHub Token received: ${accessToken.substring(0, 4)}...`);

        // 2. Get user info from GitHub
        console.log("Fetching GitHub User Profile...");
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` }
        });
        const { id: githubId, login: githubUsername, email: githubEmail, avatar_url } = userResponse.data;

        // GitHub email might be null if private, try to get emails
        let email = githubEmail;
        if (!email) {
            console.log("Fetching GitHub Emails...");
            const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `token ${accessToken}` }
            });
            const primaryEmail = emailsResponse.data.find(e => e.primary && e.verified);
            email = primaryEmail ? primaryEmail.email : null;
        }

        if (!email) throw new Error('GitHub email is required but not provided');

        // 3. Check if user exists
        let [users] = await pool.execute('SELECT * FROM users WHERE github_id = ? OR email = ?', [githubId, email]);
        let user;

        if (users.length === 0) {
            // Check if username exists, if so append random
            let finalUsername = githubUsername;
            const [existingUser] = await pool.execute('SELECT id FROM users WHERE username = ?', [finalUsername]);
            if (existingUser.length > 0) {
                finalUsername = `${githubUsername}_${Math.floor(Math.random() * 1000)}`;
            }

            const [result] = await pool.execute(
                'INSERT INTO users (username, email, github_id, password, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [finalUsername, email, githubId, 'GITHUB_AUTH_' + Math.random(), avatar_url]
            );
            user = { id: result.insertId, username: finalUsername, email, avatar_url };
        } else {
            user = users[0];
            if (!user.github_id) {
                await pool.execute('UPDATE users SET github_id = ?, avatar_url = ? WHERE id = ?', [githubId, avatar_url, user.id]);
            }
            const [updatedUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [user.id]);
            user = updatedUser[0];
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, plan: user.plan, avatar_url: user.avatar_url } });
    } catch (error) {
        console.error("GitHub Auth Error:", error.message, error.response?.data);
        res.status(500).json({ error: 'GitHub login failed' });
    }
});


// Helper: Download Audio using yt-dlp
async function downloadAudio(videoId) {
    const ytDlp = require('yt-dlp-exec');
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const outputTemplate = path.join(os.tmpdir(), `${videoId}.%(ext)s`);
    await ytDlp(videoUrl, {
        format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
        output: outputTemplate,
        noCheckCertificates: true
    });
    const downloadedFile = fs.readdirSync(os.tmpdir()).find(file => file.startsWith(videoId));
    return path.join(os.tmpdir(), downloadedFile);
}

// Helper: Transcribe Audio with Groq Whisper
// Helper: Transcribe Audio with Groq Whisper
async function transcribeWithWhisper(filePath, apiKey) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');
    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: { 'Authorization': `Bearer ${apiKey}`, ...formData.getHeaders() }
    });
    fs.unlinkSync(filePath);
    return response.data;
}

async function fetchTranscript(videoId) {
    try {
        const items = await YoutubeTranscript.fetchTranscript(videoId);
        return items.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
    } catch (e) {
        const audioPath = await downloadAudio(videoId);
        return await executeWithRotation('GROQ_API_KEY', async (key) => {
            return await transcribeWithWhisper(audioPath, key);
        });
    }
}

app.post('/api/process-video', authenticateToken, checkPlanLimits, async (req, res) => {
    const { videoId, manualTranscript } = req.body;
    const userId = req.user.id;
    console.log(`Processing video: ${videoId} for user ${userId} (${req.userPlan})`);

    try {
        // Increment usage count
        await pool.execute('UPDATE users SET usage_count = usage_count + 1 WHERE id = ?', [userId]);

        let videoInfo;
        try {
            videoInfo = await executeWithRotation('YOUTUBE_API_KEY', async (key) => {
                const youtubeRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${key}`);
                if (!youtubeRes.data.items || youtubeRes.data.items.length === 0) {
                    const err = new Error("Video not found");
                    err.response = { status: 404 };
                    throw err;
                }
                const video = youtubeRes.data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    channelTitle: video.snippet.channelTitle,
                    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
                    description: video.snippet.description,
                    hasCaptions: video.contentDetails.caption === 'true'
                };
            });
        } catch (ytError) {
            console.warn("YouTube API failed, triggering fallback to yt-dlp:", ytError.message);
            try {
                const ytDlp = require('yt-dlp-exec');
                const output = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                    dumpSingleJson: true,
                    noWarnings: true,
                    noCallHome: true,
                    noCheckCertificates: true
                });
                videoInfo = {
                    id: videoId,
                    title: output.title,
                    channelTitle: output.uploader,
                    thumbnail: output.thumbnail,
                    description: output.description,
                    hasCaptions: true
                };
            } catch (dlpError) {
                console.error("Critical: Both API and yt-dlp failed to fetch video metadata:", dlpError.message);
                return res.status(500).json({ error: "Failed to fetch video details. Please check the URL or try again later." });
            }
        }

        let transcript = manualTranscript;
        if (!transcript) {
            try {
                console.log("Fetching transcript...");
                transcript = await fetchTranscript(videoId);
            } catch (transError) {
                console.error("Transcript Error:", transError.message);
                return res.status(500).json({ error: "Failed to fetch transcript. The video might not have captions enabled." });
            }
        }

        console.log("Generating notes with Groq...");
        // Fetch user AI preferences
        let userPrefs = { ai_tone: 'educational', ai_detail_level: 'detailed', ai_language: 'en' };
        try {
            const [prefRows] = await pool.execute(
                'SELECT ai_tone, ai_detail_level, ai_language FROM users WHERE id = ?',
                [userId]
            );
            if (prefRows.length > 0) {
                userPrefs = {
                    ai_tone: prefRows[0].ai_tone || 'educational',
                    ai_detail_level: prefRows[0].ai_detail_level || 'detailed',
                    ai_language: prefRows[0].ai_language || 'en'
                };
            }
        } catch (prefError) {
            console.warn("Could not fetch user preferences, using defaults:", prefError.message);
        }

        let notes;
        try {
            notes = await executeWithRotation('GROQ_API_KEY', async (key) => {
                // ---------------------------------------------------------------
                // TOKEN BUDGET MANAGEMENT (Groq free tier: 12k TPM on 70b model)
                // llama-3.1-8b-instant has 20k TPM — better headroom on free tier.
                // System prompt + user instructions ≈ 3,000–4,000 tokens overhead.
                // Reserve 6,000 tokens for the output → ~6,000 left for transcript.
                // 1 token ≈ 4 chars → 6,000 tokens ≈ 24,000 chars of transcript max.
                // ---------------------------------------------------------------
                const MODEL = 'llama-3.1-8b-instant'; // 20k TPM free-tier; switch to llama-3.3-70b-versatile if on paid tier
                const TPM_LIMIT = 20000;               // tokens per minute for the chosen model
                const PROMPT_OVERHEAD_TOKENS = 3500;   // estimated system + user instruction tokens
                const MAX_OUTPUT_TOKENS = 4000;        // target output tokens
                const MAX_INPUT_TOKENS = TPM_LIMIT - PROMPT_OVERHEAD_TOKENS - MAX_OUTPUT_TOKENS; // ~12,500
                const MAX_TRANSCRIPT_CHARS = MAX_INPUT_TOKENS * 4; // ~50,000 chars (conservative)

                let transcriptToUse = transcript;
                let isTruncated = false;

                if (transcript.length > MAX_TRANSCRIPT_CHARS) {
                    transcriptToUse = transcript.substring(0, MAX_TRANSCRIPT_CHARS);
                    isTruncated = true;
                    console.log(`Transcript truncated: ${transcript.length} → ${MAX_TRANSCRIPT_CHARS} chars`);
                } else {
                    console.log(`Using full transcript: ${transcript.length} chars`);
                }

                // Language reminder (kept short to save tokens)
                const languageReminder = userPrefs.ai_language === 'hi'
                    ? '\nWrite ALL notes EXCLUSIVELY in Hindi Devanagari script (हिन्दी). No English, no Chinese.'
                    : userPrefs.ai_language !== 'en'
                    ? `\nWrite ALL notes EXCLUSIVELY in ${userPrefs.ai_language === 'mr' ? 'Marathi (Devanagari)' : userPrefs.ai_language === 'es' ? 'Spanish' : userPrefs.ai_language === 'fr' ? 'French' : 'German'}.`
                    : '';

                // Estimated video length for context
                const estimatedMinutes = Math.ceil(transcriptToUse.length / 750);
                const estimatedHours = Math.floor(estimatedMinutes / 60);
                const remainingMinutes = estimatedMinutes % 60;

                // Target pages: 3–8 pages (scaled to fit within token budget)
                const targetPages = Math.min(8, Math.max(3, Math.ceil(3 + (estimatedMinutes / 15))));

                const transcriptNote = isTruncated
                    ? `\nNote: Long video (~${estimatedHours > 0 ? estimatedHours + 'h ' : ''}${remainingMinutes}m). Transcript truncated. Cover the available portion.`
                    : `\nComplete transcript (~${estimatedHours > 0 ? estimatedHours + 'h ' : ''}${remainingMinutes}m).`;

                console.log(`Generating notes with preferences - Tone: ${userPrefs.ai_tone}, Detail: ${userPrefs.ai_detail_level}, Language: ${userPrefs.ai_language}`);
                console.log(`Video estimated length: ${estimatedHours > 0 ? estimatedHours + 'h ' : ''}${remainingMinutes}m (${estimatedMinutes} total minutes)`);
                console.log(`Transcript length: ${transcript.length} chars, Using: ${transcriptToUse.length} chars`);
                console.log(`Target note length: ${targetPages} pages | Model: ${MODEL} | Max output tokens: ${MAX_OUTPUT_TOKENS}`);

                // Compact system prompt to reduce token overhead
                const systemPrompt = `You are an expert note-taker. Extract and organize information ONLY from the provided transcript into clear, structured Markdown notes. Do NOT add any information not in the transcript. Use headings (#, ##, ###), bullet points, and **bold** for key terms. ${buildAISystemPrompt(userPrefs.ai_tone, userPrefs.ai_detail_level, userPrefs.ai_language)}`;

                const userPrompt = `Video: "${videoInfo.title}"${languageReminder}${transcriptNote}

Generate ${targetPages} pages of structured study notes from this transcript. Only use what is explicitly stated. Do not speculate or add external knowledge.

Transcript:
${transcriptToUse}`;

                const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: MAX_OUTPUT_TOKENS,
                    temperature: 0.3
                }, { headers: { 'Authorization': `Bearer ${key}` } });

                let generatedNotes = groqRes.data.choices[0].message.content;

                // Clean mixed scripts if Hindi is selected
                if (userPrefs.ai_language === 'hi') {
                    generatedNotes = cleanHindiText(generatedNotes, 'hi');
                    console.log('Cleaned Hindi text to remove mixed scripts');
                }

                return generatedNotes;
            });
        } catch (groqError) {
            console.error("Groq API Error:", groqError.response?.data || groqError.message);
            return res.status(groqError.response?.status || 500).json({ error: `Groq AI failed: ${groqError.message}` });
        }

        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoInfo.id}`;
            await pool.execute('INSERT INTO notes_history (user_id, video_id, title, thumbnail, notes, video_url) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, videoInfo.id, videoInfo.title, videoInfo.thumbnail, notes, videoUrl]);

            // Log Action
            logAction(userId, 'GENERATE_NOTES', { videoId: videoInfo.id, title: videoInfo.title });

            // Trigger Multi-Platform Notifications
            const summary = `Study notes for "${videoInfo.title}" have been generated successfully.`;
            
            // Add video URL to videoInfo for frontend
            videoInfo.url = videoUrl;

            // Send to external platforms
            const notifyResults = await sendNotifications(videoInfo.title, summary, videoUrl);

            // Save to internal notifications table
            const platforms = [];
            if (notifyResults.teams) platforms.push('Teams');
            if (notifyResults.telegram) platforms.push('Telegram');
            if (notifyResults.email) platforms.push('Email');

            await pool.execute(
                'INSERT INTO notifications (title, message, type, platform) VALUES (?, ?, ?, ?)',
                [videoInfo.title, summary, 'success', platforms.join(', ') || 'System']
            );

        } catch (dbError) {
            console.error("Database/Notify Error:", dbError.message);
            // Non-blocking: we still have the notes
        }

        res.json({ video: videoInfo, notes });
    } catch (error) {
        console.error("General Process Error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: error.message || 'An unexpected error occurred while processing the video' });
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications/read', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET status = "read" WHERE status = "unread"');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
    const { messages, context, videoTitle } = req.body;
    const userId = req.user.id;
    
    // Fetch user AI preferences
    let userPrefs = { ai_tone: 'educational', ai_detail_level: 'detailed', ai_language: 'en' };
    try {
        const [prefRows] = await pool.execute(
            'SELECT ai_tone, ai_detail_level, ai_language FROM users WHERE id = ?',
            [userId]
        );
        if (prefRows.length > 0) {
            userPrefs = {
                ai_tone: prefRows[0].ai_tone || 'educational',
                ai_detail_level: prefRows[0].ai_detail_level || 'detailed',
                ai_language: prefRows[0].ai_language || 'en'
            };
        }
    } catch (prefError) {
        console.warn("Could not fetch user preferences for chat, using defaults:", prefError.message);
    }

    try {
        const systemPrompt = buildAISystemPrompt(userPrefs.ai_tone, userPrefs.ai_detail_level, userPrefs.ai_language);
        const reply = await executeWithRotation('GROQ_API_KEY', async (key) => {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: `${systemPrompt} You are an AI tutor for "${videoTitle}". Use the notes: ${context}` },
                    ...messages
                ]
            }, { headers: { 'Authorization': `Bearer ${key}` } });
            return groqRes.data.choices[0].message.content;
        });
        res.json({ reply });
    } catch (error) {
        console.error("Chat API Error:", error.message, error.response?.data);
        res.status(500).json({ error: "Chat failed" });
    }
});

app.post('/api/tools', authenticateToken, async (req, res) => {
    const { toolType, notes, videoTitle } = req.body;
    const userId = req.user.id;
    const shuffle = Math.random().toString(36).substring(7);
    
    // Fetch user AI preferences
    let userPrefs = { ai_tone: 'educational', ai_detail_level: 'detailed', ai_language: 'en' };
    try {
        const [prefRows] = await pool.execute(
            'SELECT ai_tone, ai_detail_level, ai_language FROM users WHERE id = ?',
            [userId]
        );
        if (prefRows.length > 0) {
            userPrefs = {
                ai_tone: prefRows[0].ai_tone || 'educational',
                ai_detail_level: prefRows[0].ai_detail_level || 'detailed',
                ai_language: prefRows[0].ai_language || 'en'
            };
        }
    } catch (prefError) {
        console.warn("Could not fetch user preferences for tools, using defaults:", prefError.message);
    }

    const basePrompt = buildAISystemPrompt(userPrefs.ai_tone, userPrefs.ai_detail_level, userPrefs.ai_language);
    let systemPrompt = "";
    let userPrompt = "";

    switch (toolType) {
        case 'flashcards':
            systemPrompt = `You are a flashcard generator. You MUST respond with ONLY a valid JSON array. No markdown, no explanations, no text before or after the JSON. Return exactly 10 flashcard objects with 'front' and 'back' string fields. Example format: [{"front": "Q1", "back": "A1"}, ...]`;
            userPrompt = `Generate 10 flashcards from these notes. Return ONLY the JSON array, nothing else:\n\n${notes.substring(0, 15000)}`;
            break;
        case 'quiz':
            systemPrompt = `You are a quiz generator. You MUST respond with ONLY a valid JSON array. No markdown, no explanations, no text before or after the JSON. Return exactly 10 quiz objects with 'question' (string), 'options' (array of 4 strings), and 'correctIndex' (0-3 integer) fields.`;
            userPrompt = `Generate 10 multiple-choice questions from these notes. Return ONLY the JSON array, nothing else:\n\n${notes.substring(0, 15000)}`;
            break;
        case 'summary':
            systemPrompt = `${basePrompt} Summarize the notes as a clear, bullet-point markdown document with key insights grouped by topic.`;
            userPrompt = `Notes: ${notes.substring(0, 15000)}`;
            break;
        case 'key_terms':
            systemPrompt = `You are a key terms extractor. You MUST respond with ONLY a valid JSON array. No markdown, no explanations, no text before or after the JSON. Return exactly 10 objects with 'term' (string) and 'definition' (string) fields.`;
            userPrompt = `Extract 10 key terms and their definitions from these notes. Return ONLY the JSON array, nothing else:\n\n${notes.substring(0, 15000)}`;
            break;
        case 'eli5':
            systemPrompt = `${basePrompt} Explain the topic in simple terms, as if explaining to a 12-year-old. Use short sentences, simple words, and relatable analogies. Write in clear Markdown.`;
            userPrompt = `Topic: ${videoTitle}\nNotes: ${notes.substring(0, 15000)}`;
            break;
        case 'mind_map':
            systemPrompt = `You are a Mermaid.js diagram generator. Return ONLY valid Mermaid mindmap syntax. No explanations, no markdown code fences, just the raw Mermaid diagram text starting with 'mindmap'.`;
            userPrompt = `Create a mind map from these notes. Return ONLY the Mermaid syntax:\n\n${notes.substring(0, 15000)}`;
            break;
        default: return res.status(400).json({ error: "Invalid tool" });
    }

    try {
        const contentRaw = await executeWithRotation('GROQ_API_KEY', async (key) => {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.7,
                max_tokens: 4000
            }, { headers: { 'Authorization': `Bearer ${key}` } });
            return groqRes.data.choices[0].message.content;
        });

        let content = contentRaw;
        if (['flashcards', 'quiz', 'key_terms'].includes(toolType)) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                res.json({ result: JSON.parse(content) });
            } catch (parseErr) {
                console.error(`[Tools] JSON parse failed for ${toolType}:`, content.substring(0, 300));
                res.status(500).json({ error: `Failed to parse AI response for ${toolType}` });
            }
        } else if (toolType === 'mind_map') {
            content = content.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            res.json({ result: content });
        } else {
            res.json({ result: content });
        }
    } catch (error) {
        console.error(`[Tools] ${toolType} failed:`, error.response?.data || error.message);
        res.status(500).json({ error: `Tool "${toolType}" failed: ${error.response?.data?.error?.message || error.message}` });
    }
});

app.post('/api/recommendations', async (req, res) => {
    const { videoTitle, notes } = req.body;
    try {
        let recommendations = await executeWithRotation('GROQ_API_KEY', async (key) => {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Suggest 5 relevant YouTube search queries. Return ONLY a valid JSON array of 5 strings.' },
                    { role: 'user', content: `Video: ${videoTitle}\nNotes: ${notes?.substring(0, 15000)}` }
                ]
            }, { headers: { 'Authorization': `Bearer ${key}` } });

            let content = groqRes.data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : (Object.values(parsed).find(Array.isArray) || []);
        });

        const enrichedRecs = await Promise.all(recommendations.slice(0, 5).map(async (topic) => {
            try {
                return await executeWithRotation('YOUTUBE_API_KEY', async (key) => {
                    const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                        params: { part: 'snippet', maxResults: 1, q: topic, type: 'video', key: key }
                    });
                    const item = searchRes.data.items?.[0];
                    return item ? { query: topic, videoId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium?.url, channel: item.snippet.channelTitle } : { query: topic };
                });
            } catch (e) {
                return { query: topic };
            }
        }));
        res.json({ recommendations: enrichedRecs });
    } catch (error) {
        res.json({ recommendations: [] });
    }
});

// YouTube format_id -> height (for when height/format_note missing)
const FORMAT_ID_TO_HEIGHT = { 160: 144, 133: 240, 134: 360, 135: 480, 136: 720, 137: 1080, 248: 1080, 271: 1440, 272: 1440, 313: 2160, 315: 2160, 401: 2160, 402: 2160, 571: 4320, 694: 4320 };

app.get('/api/video-formats', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });
    try {
        const ytDlp = require('yt-dlp-exec');
        const info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            noPlaylist: true
        });
        const heights = new Set();
        const allFormats = info.formats || [];

        const addHeight = (h) => { if (h && h > 0) heights.add(parseInt(h, 10)); };

        allFormats.forEach(f => {
            // 1. Direct height field
            if (f.height) addHeight(f.height);
            // 2. Derive from width (3840=4K, 7680=8K)
            if (!f.height && f.width) {
                const w = parseInt(f.width, 10);
                if (w >= 7680) heights.add(4320);
                else if (w >= 3840) heights.add(2160);
                else if (w >= 2560) heights.add(1440);
                else if (w >= 1920) heights.add(1080);
                else if (w >= 1280) heights.add(720);
                else if (w >= 854) heights.add(480);
                else if (w >= 640) heights.add(360);
                else if (w >= 426) heights.add(240);
                else if (w >= 256) heights.add(144);
            }
            // 3. format_note: "2160p60", "4K", "1440p"
            const note = (f.format_note || f.format || '').toLowerCase();
            const pMatch = note.match(/(\d{3,4})p/);
            if (pMatch) addHeight(pMatch[1]);
            else if (note.includes('8k')) heights.add(4320);
            else if (note.includes('4k')) heights.add(2160);
            // 4. YouTube format_id fallback
            const fid = parseInt(f.format_id, 10);
            if (FORMAT_ID_TO_HEIGHT[fid]) heights.add(FORMAT_ID_TO_HEIGHT[fid]);
        });

        const heightToLabel = { 144: '144p', 240: '240p', 360: '360p', 480: '480p', 720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4K (Ultra HD)', 4320: '8K' };
        const heightToValue = { 144: '144p', 240: '240p', 360: '360p', 480: '480p', 720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4k', 4320: '8k' };
        const qualities = [...heights]
            .filter(h => heightToValue[h])
            .sort((a, b) => a - b)
            .map(h => ({ value: heightToValue[h], label: heightToLabel[h], height: h }));
        qualities.push({ value: 'mp3', label: 'Audio Only (MP3)' });
        res.json({ qualities });
    } catch (error) {
        console.error('Video formats error:', error.message);
        res.status(500).json({ error: 'Failed to fetch video formats' });
    }
});

app.get('/api/playlist-info', async (req, res) => {
    const { playlistId } = req.query;
    try {
        const key = await executeWithRotation('YOUTUBE_API_KEY', async (k) => k);
        let allItems = [];
        let nextPageToken = '';

        do {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    part: 'snippet,contentDetails',
                    maxResults: 50,
                    playlistId: playlistId,
                    pageToken: nextPageToken,
                    key: key
                }
            });
            allItems = allItems.concat(response.data.items);
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        const videos = allItems.map(item => ({
            id: item.contentDetails.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
        }));

        res.json({ videos });
    } catch (error) {
        console.error("Playlist Info Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch playlist info" });
    }
});

app.post('/api/download', authenticateToken, async (req, res) => {
    const { videoId, quality, title } = req.body;
    const userId = req.user.id;

    // Check Plan for Quality
    try {
        const [rows] = await pool.execute('SELECT plan FROM users WHERE id = ?', [userId]);
        const plan = rows[0]?.plan || 'free';

        const allowedQualities = {
            'free': ['144p', '240p', '360p', '480p', '720p', 'mp3'],
            'pro': ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k', 'mp3'],
            'expert': ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k', '8k', 'mp3']
        };

        if (!allowedQualities[plan].includes(quality) && quality !== 'mp3') {
            // Allow mp3 for all, but strict on video
            return res.status(403).json({ error: `Your ${plan} plan does not support ${quality} downloads. Upgrade to unlock.` });
        }
    } catch (e) {
        return res.status(500).json({ error: "Failed to verify plan limits" });
    }

    const ytDlp = require('yt-dlp-exec');

    // Check for ffmpeg
    let hasFfmpeg = false;
    try {
        const { execSync } = require('child_process');
        execSync('ffmpeg -version', { stdio: 'ignore' });
        hasFfmpeg = true;
    } catch (e) {
        console.warn("ffmpeg not found, high-quality downloads might lack audio or fail to merge.");
    }

    try {
        console.log(`Downloading ${videoId} with quality ${quality}... (ffmpeg: ${hasFfmpeg})`);

        // Define format based on quality
        const heightMap = { '144p': 144, '240p': 240, '360p': 360, '480p': 480, '720p': 720, '1080p': 1080, '1440p': 1440, '4k': 2160, '8k': 4320 };
        const maxHeight = heightMap[quality];

        let format = 'best'; // Default safe fallback
        
        if (quality === 'mp3') {
            format = 'bestaudio/best';
        } else if (maxHeight) {
            if (hasFfmpeg) {
                // If we have ffmpeg, we can merge best video and best audio
                format = `bestvideo[height<=${maxHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/best`;
            } else {
                // Without ffmpeg, we MUST pick a single file that contains both
                format = `best[height<=${maxHeight}][ext=mp4]/best[height<=${maxHeight}]/best`;
            }
        }

        const outputName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${quality}`;
        const outputPath = path.join(os.tmpdir(), `${outputName}.%(ext)s`);

        const options = {
            format: format,
            formatSort: 'res', // prefer highest resolution when multiple formats match
            output: outputPath,
            noCheckCertificates: true,
        };

        if (quality === 'mp3') {
            options.extractAudio = true;
            options.audioFormat = 'mp3';
        } else {
            options.mergeOutputFormat = 'mp4';
        }

        await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, options);

        // Log & Count Download
        await pool.execute('UPDATE users SET downloads_count = downloads_count + 1 WHERE id = ?', [userId]);
        logAction(userId, 'DOWNLOAD_VIDEO', { videoId, quality, title });

        // Find the actual file (since ext might vary)
        const files = fs.readdirSync(os.tmpdir());
        const downloadedFile = files.find(f => f.startsWith(outputName));

        if (!downloadedFile) throw new Error("Download file not found");

        const fullPath = path.join(os.tmpdir(), downloadedFile);
        res.download(fullPath, downloadedFile, (err) => {
            if (err) console.error("Send file error:", err);
            try { fs.unlinkSync(fullPath); } catch (e) { }
        });

    } catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({ error: "Download failed: " + error.message });
    }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query('SELECT * FROM notes_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/history/:id/favorite', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = parseInt(req.params.id, 10);
        const { is_favorite } = req.body;
        if (typeof is_favorite !== 'boolean') {
            return res.status(400).json({ error: 'is_favorite must be boolean' });
        }
        const [result] = await pool.execute(
            'UPDATE notes_history SET is_favorite = ? WHERE id = ? AND user_id = ?',
            [is_favorite ? 1 : 0, noteId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ success: true, is_favorite });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = parseInt(req.params.id, 10);
        const [result] = await pool.execute(
            'DELETE FROM notes_history WHERE id = ? AND user_id = ?',
            [noteId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Collections CRUD
app.get('/api/collections', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [collections] = await pool.query(
            'SELECT id, name, description, created_at FROM collections WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        for (const col of collections) {
            const [items] = await pool.query(
                'SELECT note_id FROM collection_items WHERE collection_id = ?',
                [col.id]
            );
            col.note_ids = items.map(i => i.note_id);
        }
        res.json(collections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/collections', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const [result] = await pool.execute(
            'INSERT INTO collections (user_id, name, description) VALUES (?, ?, ?)',
            [userId, name.trim(), description || null]
        );
        res.status(201).json({ id: result.insertId, name: name.trim(), description: description || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/collections/:id/items', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const collectionId = parseInt(req.params.id, 10);
        const { note_id } = req.body;
        if (!note_id) return res.status(400).json({ error: 'note_id required' });
        const [[col]] = await pool.query('SELECT id FROM collections WHERE id = ? AND user_id = ?', [collectionId, userId]);
        if (!col) return res.status(404).json({ error: 'Collection not found' });
        const [[note]] = await pool.query('SELECT id FROM notes_history WHERE id = ? AND user_id = ?', [note_id, userId]);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        await pool.execute('INSERT IGNORE INTO collection_items (collection_id, note_id) VALUES (?, ?)', [collectionId, note_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/collections/:id/items/:noteId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const collectionId = parseInt(req.params.id, 10);
        const noteId = parseInt(req.params.noteId, 10);
        const [[col]] = await pool.query('SELECT id FROM collections WHERE id = ? AND user_id = ?', [collectionId, userId]);
        if (!col) return res.status(404).json({ error: 'Collection not found' });
        await pool.execute('DELETE FROM collection_items WHERE collection_id = ? AND note_id = ?', [collectionId, noteId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Admin Routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.email, u.plan, u.role, u.usage_count, u.downloads_count, u.created_at, u.suspended_until, u.org_id, u.billing_cycle,
            o.name as org_name,
            (SELECT COUNT(*) FROM notes_history WHERE user_id = u.id) as total_notes
            FROM users u
            LEFT JOIN organizations o ON u.org_id = o.id
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/audit-logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT al.*, u.username, u.email 
            FROM audit_logs al 
            LEFT JOIN users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC LIMIT 100
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { plan, role } = req.body;
        const updates = [];
        const values = [];
        if (plan) { updates.push('plan = ?'); values.push(plan); }
        if (role) { updates.push('role = ?'); values.push(role); }
        
        if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
        
        values.push(userId);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        
        logAction(req.user.id, 'ADMIN_UPDATE_USER', { targetUserId: userId, plan, role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/:id/suspend', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { suspendedUntil } = req.body;
        await pool.execute('UPDATE users SET suspended_until = ? WHERE id = ?', [suspendedUntil || null, userId]);
        
        logAction(req.user.id, 'ADMIN_SUSPEND_USER', { targetUserId: userId, suspendedUntil });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/settings/pricing', authenticateToken, isAdmin, async (req, res) => {
    try {
        const pricing = req.body;
        await pool.execute("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'pricing_config'", [JSON.stringify(pricing)]);
        
        logAction(req.user.id, 'ADMIN_UPDATE_PRICING', pricing);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));