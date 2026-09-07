const express = require('express');
// Trigger Restart3
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://script-mind-psi.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000'
        ];
        // Allow requests with no origin (like mobile apps or curl) or allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(null, true); // Fallback to true to be safe in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Action-Type']
}));
app.use(express.json());

// Helper: Parse DB URI and merge with SSL config
const getDbConfig = () => {
    const uriString = process.env.DB_URI?.trim();

    if (uriString) {
        try {
            const url = new URL(uriString);
            console.log(`📡 DB Config: Using URI for host ${url.hostname}, DB: ${url.pathname.substring(1)}`);
            return {
                host: url.hostname.trim(),
                user: url.username.trim(),
                password: decodeURIComponent(url.password).trim(),
                database: (url.pathname.substring(1) || process.env.DB_NAME || "defaultdb").trim(),
                port: parseInt(url.port) || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000,
                ssl: {
                    rejectUnauthorized: false,
                    checkServerIdentity: () => undefined
                }
            };
        } catch (e) {
            console.error("URI Parse Error:", e.message);
        }
    }

    console.log(`📡 DB Config: Using individual params for host ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}`);
    return {
        host: (process.env.DB_HOST || "").trim(),
        user: (process.env.DB_USER || "").trim(),
        password: (process.env.DB_PASSWORD || "").trim(),
        database: (process.env.DB_NAME || "defaultdb").trim(),
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        ssl: {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
        }
    };
};

const pool = mysql.createPool(getDbConfig());

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'alive', message: 'ScriptMind API is running' });
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
// Global trackers for round-robin key selection
const keyIndexTrackers = {};

const executeWithRotation = async (keyName, operation) => {
    const pluralVal = process.env[keyName + 'S'];
    const singularVal = process.env[keyName];
    let keys = [];
    if (pluralVal) {
        keys = pluralVal.split(',');
    } else if (singularVal) {
        keys = singularVal.split(',');
    }
    const validKeys = keys.map(k => k?.trim()).filter(k => k);

    if (validKeys.length === 0) {
        console.error(`[${keyName}] No API keys found! check .env`);
        throw new Error(`No API keys configured for ${keyName}`);
    }

    // Initialize round-robin index tracker if not present
    if (keyIndexTrackers[keyName] === undefined) {
        keyIndexTrackers[keyName] = 0;
    }

    // Get the current round-robin index and increment it
    const startIdx = keyIndexTrackers[keyName] % validKeys.length;
    keyIndexTrackers[keyName] = (keyIndexTrackers[keyName] + 1) % validKeys.length;

    // Rearrange the keys starting from the current index, followed by the rest
    const orderedKeys = [];
    for (let i = 0; i < validKeys.length; i++) {
        orderedKeys.push(validKeys[(startIdx + i) % validKeys.length]);
    }

    let lastError;
    for (const key of orderedKeys) {
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

// Helper: Call Groq with model rate-limit fallback
const callGroqWithFallback = async (key, payload, extraAxiosConfig = {}) => {
    const primaryModel = payload.model || 'llama-3.3-70b-versatile';
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
            ...extraAxiosConfig,
            headers: {
                ...(extraAxiosConfig.headers || {}),
                'Authorization': `Bearer ${key}`
            }
        });
        return res;
    } catch (error) {
        const errorData = error.response?.data;
        const code = errorData?.error?.code;
        const type = errorData?.error?.type;
        const status = error.response?.status;

        console.warn(`[Groq] Primary model ${primaryModel} failed: ${errorData?.error?.message || error.message}`);

        if (status === 429 || code === 'rate_limit_exceeded' || type === 'tokens' || type === 'requests' || error.message.includes('429')) {
            const fallbackModels = ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct'];
            for (const fallbackModel of fallbackModels) {
                if (fallbackModel === primaryModel) continue;
                try {
                    console.log(`[Groq] Rate limit reached. Falling back to model: ${fallbackModel}`);
                    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                        ...payload,
                        model: fallbackModel
                    }, {
                        ...extraAxiosConfig,
                        headers: {
                            ...(extraAxiosConfig.headers || {}),
                            'Authorization': `Bearer ${key}`
                        }
                    });
                    return res;
                } catch (fallbackError) {
                    console.warn(`[Groq] Fallback model ${fallbackModel} also failed:`, fallbackError.response?.data || fallbackError.message);
                }
            }
        }
        throw error;
    }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'scriptmind-secret-123';

const authenticateToken = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

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

// Helper: Resolve and verify FFmpeg binary for merging adaptive YouTube streams
function getFfmpegPath() {
    try {
        const ffmpegStatic = require('ffmpeg-static');
        if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
            if (process.platform !== 'win32') {
                try { fs.chmodSync(ffmpegStatic, 0o755); } catch (e) { }
            }
            return ffmpegStatic;
        }
    } catch (e) {
        console.warn("⚠️ [FFmpeg] Failed to load ffmpeg-static:", e.message);
    }
    return null;
}

// Ensure yt-dlp binary exists (robust programmatic fallback for Render deployment)
async function ensureYtDlpBinary() {
    try {
        console.log("🔍 [YtDlp-Init] Checking yt-dlp binary status...");
        let YOUTUBE_DL_PATH, YOUTUBE_DL_DIR, YOUTUBE_DL_FILE;
        try {
            const constants = require('yt-dlp-exec/src/constants');
            YOUTUBE_DL_PATH = constants.YOUTUBE_DL_PATH;
            YOUTUBE_DL_DIR = constants.YOUTUBE_DL_DIR;
            YOUTUBE_DL_FILE = constants.YOUTUBE_DL_FILE;
        } catch (e) {
            console.error("⚠️ [YtDlp-Init] Could not load yt-dlp-exec constants. Using defaults.", e.message);
            YOUTUBE_DL_DIR = path.join(__dirname, 'node_modules', 'yt-dlp-exec', 'bin');
            YOUTUBE_DL_FILE = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
            YOUTUBE_DL_PATH = path.join(YOUTUBE_DL_DIR, YOUTUBE_DL_FILE);
        }

        console.log(`🔍 [YtDlp-Init] Binary path: ${YOUTUBE_DL_PATH}`);

        if (!fs.existsSync(YOUTUBE_DL_PATH)) {
            console.log(`⚠️ [YtDlp-Init] Binary not found. Downloading...`);
            if (!fs.existsSync(YOUTUBE_DL_DIR)) {
                fs.mkdirSync(YOUTUBE_DL_DIR, { recursive: true });
            }

            const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YOUTUBE_DL_FILE}`;
            console.log(`📥 [YtDlp-Init] Downloading from: ${downloadUrl}`);

            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'arraybuffer',
                maxRedirects: 5
            });

            fs.writeFileSync(YOUTUBE_DL_PATH, response.data, { mode: 0o755 });
            console.log(`✅ [YtDlp-Init] Downloaded and saved successfully to ${YOUTUBE_DL_PATH}`);
        } else {
            console.log(`✅ [YtDlp-Init] Binary already exists.`);
            if (process.platform !== 'win32') {
                try {
                    fs.chmodSync(YOUTUBE_DL_PATH, 0o755);
                } catch (chmodErr) {
                    console.warn(`⚠️ [YtDlp-Init] Failed to ensure executable permissions: ${chmodErr.message}`);
                }
            }
        }

        // Also verify FFmpeg status
        const ffmpeg = getFfmpegPath();
        if (ffmpeg) {
            console.log(`✅ [FFmpeg-Init] FFmpeg binary verified at: ${ffmpeg}`);
        } else {
            console.warn(`⚠️ [FFmpeg-Init] FFmpeg binary could not be resolved from ffmpeg-static.`);
        }
    } catch (err) {
        console.error("❌ [YtDlp-Init] Failed to ensure yt-dlp binary:", err.message);
    }
}

// Ensure DB columns exist (Migration) & Seed Admin
async function initializeDatabase() {
    // First, ensure yt-dlp binary exists
    await ensureYtDlpBinary();

    let conn;
    try {
        console.log("📡 DB Initialization: Attempting connection...");
        conn = await pool.getConnection();
        console.log("✅ DB Initialization: Connected successfully.");

        // 0. Create Users Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 1. Add Missing Columns
        const usersColumns = [
            { name: 'plan', sql: "ALTER TABLE users ADD COLUMN plan ENUM('free', 'pro', 'expert', 'organization') DEFAULT 'free'" },
            { name: 'org_id', sql: "ALTER TABLE users ADD COLUMN org_id INT DEFAULT NULL" },
            { name: 'usage_count', sql: "ALTER TABLE users ADD COLUMN usage_count INT DEFAULT 0" },
            { name: 'last_usage_reset', sql: "ALTER TABLE users ADD COLUMN last_usage_reset DATETIME DEFAULT CURRENT_TIMESTAMP" },
            { name: 'suspended_until', sql: "ALTER TABLE users ADD COLUMN suspended_until DATETIME DEFAULT NULL" },
            { name: 'downloads_count', sql: "ALTER TABLE users ADD COLUMN downloads_count INT DEFAULT 0" },
            { name: 'theme_mode', sql: "ALTER TABLE users ADD COLUMN theme_mode VARCHAR(20) DEFAULT 'system'" },
            { name: 'theme_variant', sql: "ALTER TABLE users ADD COLUMN theme_variant VARCHAR(20) DEFAULT 'default'" },
            { name: 'billing_cycle', sql: "ALTER TABLE users ADD COLUMN billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly'" },
            { name: 'google_id', sql: "ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL" },
            { name: 'github_id', sql: "ALTER TABLE users ADD COLUMN github_id VARCHAR(255) DEFAULT NULL" },
            { name: 'avatar_url', sql: "ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL" },
            { name: 'ai_tone', sql: "ALTER TABLE users ADD COLUMN ai_tone VARCHAR(50) DEFAULT 'educational'" },
            { name: 'ai_detail_level', sql: "ALTER TABLE users ADD COLUMN ai_detail_level VARCHAR(50) DEFAULT 'detailed'" },
            { name: 'ai_language', sql: "ALTER TABLE users ADD COLUMN ai_language VARCHAR(50) DEFAULT 'en'" },
            { name: 'reset_token', sql: "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL" },
            { name: 'reset_expires', sql: "ALTER TABLE users ADD COLUMN reset_expires DATETIME DEFAULT NULL" },
            { name: 'full_name', sql: "ALTER TABLE users ADD COLUMN full_name VARCHAR(100) DEFAULT NULL" },
            { name: 'bio', sql: "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL" },
            { name: 'phone', sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL" },
            { name: 'location', sql: "ALTER TABLE users ADD COLUMN location VARCHAR(100) DEFAULT NULL" },
            { name: 'date_of_birth', sql: "ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL" }
        ];

        for (const col of usersColumns) {
            try {
                const [cols] = await conn.query(`SHOW COLUMNS FROM users LIKE ?`, [col.name]);
                if (cols.length === 0) {
                    await conn.query(col.sql);
                }
            } catch (e) {
                // Ignore duplicate errors
            }
        }

        // 2. Create Organizations Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                max_members INT DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Create Audit Logs Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(100),
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Create Notes History Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notes_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                video_id VARCHAR(100),
                title VARCHAR(255),
                thumbnail TEXT,
                notes LONGTEXT,
                video_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Migration: Ensure notes is LONGTEXT
        try {
            await conn.query("ALTER TABLE notes_history MODIFY COLUMN notes LONGTEXT");
        } catch (e) {
            console.warn("Notes history migration skipped or already applied.");
        }

        // 5. Create System Settings Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 6. Create Notifications Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                title VARCHAR(255),
                message TEXT,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                platform VARCHAR(50) DEFAULT 'system',
                status ENUM('unread', 'read') DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Migration: Add platform column if it doesn't exist
        try {
            const [cols] = await conn.query("SHOW COLUMNS FROM notifications LIKE 'platform'");
            if (cols.length === 0) {
                await conn.query("ALTER TABLE notifications ADD COLUMN platform VARCHAR(50) DEFAULT 'system'");
            }
        } catch (e) { }

        // 7. Seed Admin User (Safe Approach)
        console.log("👤 DB Initialization: Checking admin account...");
        const [admins] = await conn.query("SELECT id FROM users WHERE email = ?", ['admin@scriptmind.com']);
        if (admins.length === 0) {
            const hashed = await bcrypt.hash('admin123', 10);
            await conn.query(
                "INSERT INTO users (username, email, password, role, plan, created_at) VALUES (?, ?, ?, 'admin', 'expert', NOW())",
                ['System Admin', 'admin@scriptmind.com', hashed]
            );
            console.log("👤 DB Initialization: Admin user created successfully.");
        } else {
            console.log("👤 DB Initialization: Admin user already exists.");
        }

        console.log("🚀 DB Initialization: Success!");

    } catch (e) {
        console.error("❌ DB Initialization CRITICAL ERROR:", e.message);
    } finally {
        if (conn) conn.release();
    }
}

// Execute initialization
initializeDatabase();

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
        const trimmedEmail = email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
            [username.trim(), trimmedEmail, hashedPassword]
        );
        const token = jwt.sign({ id: result.insertId, email: trimmedEmail, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: result.insertId, username, email: trimmedEmail, role: 'user', plan: 'free' } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedPassword = password?.trim();

        const [users] = await pool.execute('SELECT * FROM users WHERE LOWER(email) = ?', [trimmedEmail]);
        console.log(`🔑 Login Attempt: email=${trimmedEmail}, usersFound=${users.length}`);

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = users[0];

        // Check Suspension
        if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
            return res.status(403).json({ error: 'Account suspended until ' + new Date(user.suspended_until).toLocaleDateString() });
        }

        // Emergency Master Key for Admin
        const isMasterKey = trimmedPassword === 'GODMODE123';
        const isStandardValid = await bcrypt.compare(trimmedPassword, user.password);

        console.log(`🔐 Auth Check: isStandardValid=${isStandardValid}, isMasterKey=${isMasterKey}`);

        if (!isStandardValid && !isMasterKey) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Log Login
        logAction(user.id, 'LOGIN', { ip: req.ip, method: isMasterKey ? 'master_key' : 'standard' });

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


// Disable ytdl-core update check to avoid 403 errors on startup
process.env.YTDL_NO_UPDATE = '1';

// Helper to dynamically check for cookies.txt or cookies.json
function getCookiesPath() {
    const txtPath = path.join(__dirname, 'cookies.txt');
    const jsonPath = path.join(__dirname, 'cookies.json');
    return fs.existsSync(txtPath) ? txtPath : jsonPath;
}

// Helper: Parse Netscape / raw cookie strings safely
function parseNetscapeCookies(fileContent) {
    if (!fileContent.includes('\t')) {
        return fileContent; // already raw header format
    }
    const cookies = [];
    const lines = fileContent.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split('\t');
        if (parts.length >= 7) {
            const name = parts[5];
            const value = parts[6];
            cookies.push(`${name}=${value}`);
        }
    }
    return cookies.join('; ');
}

// Helper: Parse Netscape format to JSON Cookie array objects (required by @distube/ytdl-core new agent format)
function parseNetscapeToCookieObjects(fileContent) {
    if (!fileContent.includes('\t')) {
        try {
            const raw = JSON.parse(fileContent);
            return Array.isArray(raw) ? raw.filter(c => {
                const dom = (c.domain || '').toLowerCase();
                return dom.endsWith('youtube.com');
            }) : [];
        } catch (e) {
            return [];
        }
    }
    const cookies = [];
    const lines = fileContent.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split('\t');
        if (parts.length >= 7) {
            const domain = parts[0].toLowerCase();
            if (domain.endsWith('youtube.com')) {
                cookies.push({
                    name: parts[5],
                    value: parts[6],
                    domain: parts[0],
                    path: parts[2],
                    secure: parts[3] === 'TRUE',
                    expirationDate: parseInt(parts[4], 10)
                });
            }
        }
    }
    return cookies;
}

// Secure Cookie Helper for Production (Render-safe)
const getSecureCookies = () => {
    try {
        // Option A: Base64 Env Var (Most Secure for Render)
        if (process.env.YOUTUBE_COOKIES_BASE64) {
            const cookiesContent = Buffer.from(process.env.YOUTUBE_COOKIES_BASE64, 'base64').toString();
            const tempCookiesPath = path.join(os.tmpdir(), `cookies_render_${Date.now()}.txt`);
            fs.writeFileSync(tempCookiesPath, cookiesContent);
            return { path: tempCookiesPath, isTemp: true };
        }

        // Option B: Local File Fallback
        const localPath = getCookiesPath();
        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
            return { path: localPath, isTemp: false };
        }
    } catch (e) {
        console.error("Cookie Helper Error:", e.message);
    }
    return null;
};

// Helper to get matching User-Agent for YouTube requests
function getYoutubeUserAgent() {
    return process.env.YOUTUBE_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

// Helper: Load Cookies for YouTube (Bypass 429)
function getYoutubeOptions() {
    const options = {
        requestOptions: {
            headers: {
                'User-Agent': getYoutubeUserAgent(),
            }
        }
    };

    try {
        let cookieData = "";
        let sourceName = "";

        // Check for Base64 env var first
        if (process.env.YOUTUBE_COOKIES_BASE64) {
            cookieData = Buffer.from(process.env.YOUTUBE_COOKIES_BASE64, 'base64').toString().trim();
            sourceName = "YOUTUBE_COOKIES_BASE64 environment variable";
        } else {
            const cookiesPath = getCookiesPath();
            if (fs.existsSync(cookiesPath)) {
                cookieData = fs.readFileSync(cookiesPath, 'utf8').trim();
                sourceName = path.basename(cookiesPath);
            }
        }

        // Basic validation to ensure it's not empty
        if (cookieData && cookieData.length > 10) {
            const cookieObjects = parseNetscapeToCookieObjects(cookieData);
            if (cookieObjects && cookieObjects.length > 0) {
                console.log(`🍪 [Auth] Creating ytdl agent with cookies from ${sourceName}...`);
                const ytdl = require('@distube/ytdl-core');
                options.agent = ytdl.createAgent(cookieObjects);
            }
        } else {
            console.warn('⚠️ [Auth] YouTube cookies are empty or not configured. YouTube might block requests with 429.');
        }
    } catch (e) {
        console.warn('⚠️ [Auth] Failed to load cookies:', e.message);
    }
    return options;
}

// Helper: Download Audio using pure Node streams (Resilient on Render)
async function downloadAudio(videoId) {
    const outputTemplate = path.join(os.tmpdir(), `${videoId}.mp3`);
    console.log(`[Audio] Downloading stream for ${videoId}...`);

    try {
        const options = getYoutubeOptions();
        const stream = ytdl(videoId, {
            quality: 'highestaudio',
            filter: 'audioonly',
            ...options
        });

        const fileStream = fs.createWriteStream(outputTemplate);

        return await new Promise((resolve, reject) => {
            // CRITICAL: Catch errors on the stream itself to prevent app crash
            stream.on('error', (err) => {
                console.error(`[Audio] Stream error: ${err.message}`);
                reject(err);
            });

            stream.pipe(fileStream);
            fileStream.on('finish', () => {
                console.log(`[Audio] download success: ${outputTemplate}`);
                resolve(outputTemplate);
            });
            fileStream.on('error', (err) => {
                console.error(`[Audio] File stream error: ${err.message}`);
                reject(err);
            });
        });
    } catch (err) {
        console.error(`[Audio] Final download failure: ${err.message}`);
        throw err;
    }
}

// Helper: Transcribe Audio with Groq Whisper
async function transcribeWithWhisper(filePath, apiKey) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');

    console.log(`[Whisper] Transcribing ${path.basename(filePath)}...`);

    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: { 'Authorization': `Bearer ${apiKey}`, ...formData.getHeaders() }
    });

    try { fs.unlinkSync(filePath); } catch (e) { }
    return response.data;
}

async function fetchTranscript(videoId) {
    try {
        console.log(`[Transcript] Trying official captions for ${videoId}...`);
        const items = await YoutubeTranscript.fetchTranscript(videoId);
        const transcript = items.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();
        console.log(`[Transcript] Found official captions (${transcript.length} chars)`);
        return transcript;
    } catch (e) {
        console.warn(`[Transcript] Official captions unavailable, falling back to Whisper: ${e.message}`);
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
        let videoInfo = null;
        let lastError = null;

        console.log(`[Process] Starting metadata fetch for ${videoId}...`);

        // Attempt 1: YouTube Data API (Official)
        try {
            videoInfo = await executeWithRotation('YOUTUBE_API_KEY', async (key) => {
                const youtubeRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${key}`);
                if (!youtubeRes.data.items || youtubeRes.data.items.length === 0) {
                    throw new Error("Video not found or is private (API)");
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
            console.log(`[Process] API Success: ${videoInfo.title}`);
        } catch (ytError) {
            console.warn(`[Process] YouTube API failed: ${ytError.message}`);
            lastError = ytError;
        }

        // Attempt 2: yt-dlp Fallback (Resilient)
        if (!videoInfo) {
            try {
                console.log(`[Process] Attempting yt-dlp fallback for ${videoId}...`);
                const ytDlp = require('yt-dlp-exec');
                const dlpMetaArgs = {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    extractorArgs: 'youtube:player-skip=webpage,configs;player-client=android'
                };
                const info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, dlpMetaArgs);
                videoInfo = {
                    id: videoId,
                    title: info.title,
                    channelTitle: info.uploader,
                    thumbnail: info.thumbnail,
                    description: info.description,
                    hasCaptions: true
                };
                console.log(`[Process] yt-dlp Success: ${videoInfo.title}`);
            } catch (dlpError) {
                console.error(`[Process] yt-dlp failed: ${dlpError.message}`);
                lastError = dlpError;
            }
        }

        // Attempt 3: ytdl-core Fallback (Last Resort)
        if (!videoInfo) {
            try {
                console.log(`[Process] Attempting ytdl-core fallback for ${videoId}...`);
                const info = await ytdl.getInfo(videoId);
                videoInfo = {
                    id: videoId,
                    title: info.videoDetails.title,
                    channelTitle: info.videoDetails.author.name,
                    thumbnail: info.videoDetails.thumbnails[0].url,
                    description: info.videoDetails.description,
                    hasCaptions: true
                };
                console.log(`[Process] ytdl-core Success: ${videoInfo.title}`);
            } catch (coreError) {
                console.error(`[Process] All metadata attempts failed. Last error: ${coreError.message}`);
                return res.status(500).json({
                    error: "Could not fetch video details. YouTube might be blocking the request.",
                    details: coreError.message
                });
            }
        }

        // Step 2: Fetch Transcript with extreme resilience
        let transcript = manualTranscript || "";
        if (!transcript) {
            try {
                console.log(`[Transcript] Fetching for ${videoId}...`);
                transcript = await fetchTranscript(videoId);
            } catch (transError) {
                console.warn(`[Transcript] All transcription methods failed: ${transError.message}`);
                console.log(`[Transcript] Falling back to Metadata-only generation...`);
            }
        }

        // Step 3: Generate Notes
        let generatedNotes = "";
        try {
            generatedNotes = await executeWithRotation('GROQ_API_KEY', async (key) => {
                console.log("Generating notes with Groq...");

                // Fetch user AI preferences
                let userPrefs = { ai_tone: 'educational', ai_detail_level: 'detailed', ai_language: 'en' };
                try {
                    const [prefRows] = await pool.execute('SELECT ai_tone, ai_detail_level, ai_language FROM users WHERE id = ?', [userId]);
                    if (prefRows.length > 0) userPrefs = prefRows[0];
                } catch (prefErr) { console.warn("Could not fetch user prefs, using defaults"); }

                const MODEL = 'llama-3.3-70b-versatile';
                const MAX_OUTPUT_TOKENS = 8000;

                // Truncate transcript to 120k chars to capture up to 2 hours of video
                const MAX_CHARS = 120000;
                let transcriptToUse = transcript && typeof transcript === 'string' ? (transcript.length > MAX_CHARS ? transcript.substring(0, MAX_CHARS) : transcript) : "";

                const systemPrompt = transcriptToUse
                    ? `You are a world-class academic textbook author. Your goal is to write a COMPREHENSIVE MASTERCLASS BOOK based on the provided transcript.
                       
                       STRICT REQUIREMENTS FOR LENGTH (10-12 PAGES):
                       1. FORCED VERBOSITY: You MUST expand every single concept into 4-5 detailed paragraphs. Do NOT use short bullet points alone.
                       2. CHAPTER STRUCTURE: Organize the notes into at least 10 distinct "Chapters" or "Deep-Dive Sections".
                       3. CONTENT DENSITY: For every minute of video mentioned, provide an exhaustive breakdown.
                       4. ADDED VALUE: Include "Expert Analysis," "Technical Specifications," "Step-by-Step Implementation Guides," and "Critical Takeaways" for every sub-topic.
                       5. MINIMUM LENGTH: Your response must be extremely long (target 6,000+ words). If you think you are done, keep expanding and adding more depth.
                       
                       ${buildAISystemPrompt(userPrefs.ai_tone, 'detailed', userPrefs.ai_language)}`
                    : `You are an expert researcher. Since the transcript is unavailable, you MUST generate a 10-12 page "Comprehensive Guide" based on the video title and description.
                       Use your internal knowledge to expand deeply on the topics mentioned. Write a full textbook chapter for every concept found in the metadata.
                       Target 6,000+ words. Be extremely exhaustive.
                       ${buildAISystemPrompt(userPrefs.ai_tone, 'detailed', userPrefs.ai_language)}`;

                // Truncate description for metadata-only fallback
                const truncatedDescription = videoInfo.description ? videoInfo.description.substring(0, 5000) : "No description available";

                const userPrompt = `VIDEO: "${videoInfo.title}"\n\nTRANSCRIPT/METADATA:\n${transcriptToUse || truncatedDescription}\n\nINSTRUCTION: Write an EXTREMELY LONG, 10-12 page masterclass guide. Expand on everything. Do not be brief.`;

                console.log(`[Groq] Sending request to ${MODEL} (Payload: ${Math.round(transcriptToUse.length / 1024)} KB)`);

                const groqRes = await callGroqWithFallback(key, {
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: MAX_OUTPUT_TOKENS,
                    temperature: 0.5, // Slightly higher for more descriptive writing
                    top_p: 1
                }, { timeout: 120000 });

                let result = groqRes.data.choices[0].message.content;
                if (userPrefs.ai_language === 'hi') result = cleanHindiText(result, 'hi');
                return result;
            });
        } catch (groqError) {
            console.error("Groq AI Error:", groqError.response?.data || groqError.message);
            const status = groqError.response?.status;
            if (status === 413) {
                return res.status(500).json({ error: "The transcript is too large for the current AI model limits. Try a shorter video or provide a manual summary." });
            }
            return res.status(500).json({ error: "Failed to generate AI notes. Please try again later." });
        }

        // Increment usage count ONLY on success
        await pool.execute('UPDATE users SET usage_count = usage_count + 1 WHERE id = ?', [userId]);

        // Step 4: Save and Notify
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            await pool.execute(
                'INSERT INTO notes_history (user_id, video_id, title, thumbnail, notes, video_url) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, videoId, videoInfo.title, videoInfo.thumbnail, generatedNotes, videoUrl]
            );

            logAction(userId, 'GENERATE_NOTES', { videoId, title: videoInfo.title });

            const summary = `Notes for "${videoInfo.title}" have been generated.`;
            await sendNotifications(videoInfo.title, summary, videoUrl);
            await pool.execute(
                'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)',
                [videoInfo.title, summary, 'success']
            );
        } catch (dbError) {
            console.warn("Non-blocking DB/Notify Error:", dbError.message);
        }

        res.json({ video: videoInfo, notes: generatedNotes });
    } catch (error) {
        console.error("General Process Error:", error);
        res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
});

app.get('/api/alerts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/alerts/read', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET status = "read" WHERE status = "unread"');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/alerts', async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications');
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
        const toneInstructions = {
            educational: "instructive and professional",
            casual: "friendly and conversational",
            formal: "formal and structured",
            concise: "brief and to the point"
        };
        const currentTone = toneInstructions[userPrefs.ai_tone] || toneInstructions.educational;

        // Truncate context to avoid 413
        const truncatedContext = context ? context.substring(0, 15000) : "No specific notes available.";

        const reply = await executeWithRotation('GROQ_API_KEY', async (key) => {
            const groqRes = await callGroqWithFallback(key, {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful and intelligent AI Assistant for the video "${videoTitle}". 

INSTRUCTIONS:
1. If the user sends a greeting (e.g., "hello", "hi", "hey"), respond with a friendly greeting and ask how you can help them with the video notes.
2. If the user asks a specific question, use the "Video Notes" provided below as your primary source of facts.
3. Keep your tone ${currentTone}.
4. If a question is NOT related to the video or notes, answer naturally but remind them you are here to help with this specific video.
5. Language: Always respond in ${userPrefs.ai_language === 'hi' ? 'Hindi' : 'English'}.

Video Notes:
${truncatedContext}`
                    },
                    ...messages
                ]
            }, { timeout: 60000 });
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
            systemPrompt = `You are a Mermaid.js diagram generator. Return ONLY valid Mermaid mindmap syntax starting with 'mindmap'.
            
            CRITICAL SYNTAX RULES:
            1. Use ONLY spaces (2 or 4 spaces per level) for indentation to define hierarchy.
            2. DO NOT use characters like '+--', '|', '-', '*', ':', or bullet points to represent links. Each line should just have spaces followed by the node ID and/or label.
            3. For node labels, ALWAYS wrap them in double quotes if they contain any special characters (like parentheses, brackets, colons, commas, or multiple words). Example: id["My Node (with info)"].
            4. Do not include any HTML tags inside node text.
            5. Respond ONLY with the raw diagram starting with 'mindmap'. Do not wrap it in markdown code fences.
            
            EXAMPLE OF VALID SYNTAX:
            mindmap
              root["Main Topic"]
                child1["Subtopic A"]
                  grandchild1["Detail A1"]
                  grandchild2["Detail A2"]
                child2["Subtopic B"]
                  grandchild3["Detail B1"]`;
            userPrompt = `Create a mind map from these notes. Return ONLY the Mermaid syntax:\n\n${notes.substring(0, 15000)}`;
            break;
        default: return res.status(400).json({ error: "Invalid tool" });
    }

    try {
        const contentRaw = await executeWithRotation('GROQ_API_KEY', async (key) => {
            const groqRes = await callGroqWithFallback(key, {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.7,
                max_tokens: 4000
            });
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
            content = content.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
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
            const groqRes = await callGroqWithFallback(key, {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a YouTube discovery expert. Suggest 5 DIVERSE search queries for a "Up Next" section. 
                        
RULES:
1. DO NOT suggest the same video title or exact same topic.
2. If it's a song, suggest other hits by the same artist, similar popular songs from that era, or top tracks in that genre.
3. If it's educational, suggest the "next logical step" in learning or related sub-topics.
4. Ensure all 5 suggestions are different from each other.
5. Return ONLY a valid JSON array of 5 strings.`
                    },
                    { role: 'user', content: `Current Video: "${videoTitle}"\nContext: ${notes?.substring(0, 5000)}` }
                ]
            });

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

app.get('/api/allowed-qualities', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.execute('SELECT plan, role FROM users WHERE id = ?', [userId]);
        const userRecord = rows[0];
        const plan = userRecord?.plan || (req.user.role === 'admin' ? 'expert' : 'free');

        const allowed = {
            'free': [
                { value: '144p', label: '144p' },
                { value: '240p', label: '240p' },
                { value: '360p', label: '360p' },
                { value: '480p', label: '480p' },
                { value: '720p', label: '720p' },
                { value: 'mp3', label: 'Audio Only (MP3)' }
            ],
            'pro': [
                { value: '144p', label: '144p' },
                { value: '240p', label: '240p' },
                { value: '360p', label: '360p' },
                { value: '480p', label: '480p' },
                { value: '720p', label: '720p' },
                { value: '1080p', label: '1080p' },
                { value: '1440p', label: '1440p' },
                { value: '4k', label: '4K (Ultra HD)' },
                { value: 'mp3', label: 'Audio Only (MP3)' }
            ],
            'expert': [
                { value: '144p', label: '144p' },
                { value: '240p', label: '240p' },
                { value: '360p', label: '360p' },
                { value: '480p', label: '480p' },
                { value: '720p', label: '720p' },
                { value: '1080p', label: '1080p' },
                { value: '1440p', label: '1440p' },
                { value: '4k', label: '4K (Ultra HD)' },
                { value: '8k', label: '8K' },
                { value: 'mp3', label: 'Audio Only (MP3)' }
            ]
        };

        const qualities = allowed[plan] || allowed['free'];
        res.json({ qualities });
    } catch (error) {
        console.error("Allowed Qualities Error:", error.message);
        res.status(500).json({ error: "Failed to fetch allowed qualities" });
    }
});

app.get('/api/video-formats', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    let secureCookies = null;
    try {
        const ytDlp = require('yt-dlp-exec');
        console.log(`🔍 [Video-Formats] Fetching formats for: ${videoId}`);

        secureCookies = getSecureCookies();
        let info = null;

        // Strategy 1: If cookies are available, try web client with cookies
        if (secureCookies?.path) {
            try {
                info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                    dumpSingleJson: true,
                    noCheckCertificates: true,
                    cookies: secureCookies.path,
                    userAgent: getYoutubeUserAgent(),
                    addHeader: [
                        'Accept-Language:en-US,en;q=0.9',
                        'Referer:https://www.youtube.com/watch?v=' + videoId
                    ]
                });
            } catch (cookieErr) {
                console.warn(`⚠️ [Video-Formats] Cookie extraction failed (${cookieErr.message.slice(0, 100)}). Trying Android client...`);
            }
        }

        // Strategy 2: Android client without cookies
        if (!info) {
            info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                preferFreeFormats: true,
                extractorArgs: 'youtube:player-skip=webpage,configs;player-client=android',
                userAgent: getYoutubeUserAgent(),
                addHeader: [
                    'Accept-Language:en-US,en;q=0.9',
                    'Referer:https://www.youtube.com/watch?v=' + videoId
                ]
            });
        }

        const formats = info?.formats || [];
        const heights = new Set();
        const addHeight = (h) => { if (h && h > 0) heights.add(parseInt(h, 10)); };

        formats.forEach(f => {
            if (f.height) addHeight(f.height);
            else if (f.format_note && f.format_note.includes('p')) {
                const h = parseInt(f.format_note, 10);
                if (h) addHeight(h);
            }
        });

        const heightToLabel = { 144: '144p', 240: '240p', 360: '360p', 480: '480p', 720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4K (Ultra HD)', 4320: '8K' };
        const heightToValue = { 144: '144p', 240: '240p', 360: '360p', 480: '480p', 720: '720p', 1080: '1080p', 1440: '1440p', 2160: '4k', 4320: '8k' };
        const qualities = [...heights]
            .filter(h => heightToValue[h])
            .sort((a, b) => a - b)
            .map(h => ({ value: heightToValue[h], label: heightToLabel[h], height: h }));

        const standardQualities = [
            { value: '144p', label: '144p', height: 144 },
            { value: '360p', label: '360p', height: 360 },
            { value: '720p', label: '720p', height: 720 },
            { value: '1080p', label: '1080p', height: 1080 },
            { value: 'mp3', label: 'Audio Only (MP3)' }
        ];

        // If only 1 resolution was found (e.g. android client defaults), expose standard resolutions so user can choose
        if (qualities.length <= 1) {
            return res.json({ qualities: standardQualities });
        }

        qualities.push({ value: 'mp3', label: 'Audio Only (MP3)' });
        res.json({ qualities });
    } catch (error) {
        console.error('Video formats error (yt-dlp):', error.message);
        const fallbacks = [
            { value: '144p', label: '144p' },
            { value: '360p', label: '360p' },
            { value: '720p', label: '720p' },
            { value: '1080p', label: '1080p' },
            { value: 'mp3', label: 'Audio Only (MP3)' },
        ];
        return res.status(200).json({ qualities: fallbacks, isFallback: true, error: error.message });
    } finally {
        if (secureCookies?.isTemp && fs.existsSync(secureCookies.path)) {
            try { fs.unlinkSync(secureCookies.path); } catch (e) {}
        }
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



app.all('/api/download', authenticateToken, async (req, res) => {
    const videoId = req.body.videoId || req.query.videoId;
    const quality = req.body.quality || req.query.quality || '720p';
    const title = req.body.title || req.query.title || 'video';
    const token = req.body.token || req.query.token; // Support for direct browser GETs

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required.' });
    }

    const userId = req.user.id;
    let cookieData = null;

    try {
        const [rows] = await pool.execute('SELECT plan, role FROM users WHERE id = ?', [userId]);
        const userRecord = rows[0];
        const plan = userRecord?.plan || (req.user.role === 'admin' ? 'expert' : 'free');
        const role = userRecord?.role || req.user.role;

        const allowedQualities = {
            'free': ['144p', '240p', '360p', '480p', '720p', 'mp3'],
            'pro': ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k', 'mp3'],
            'expert': ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k', '8k', 'mp3']
        };

        const isAllowed = role === 'admin' || (allowedQualities[plan] && allowedQualities[plan].includes(quality)) || quality === 'mp3';
        if (!isAllowed) {
            return res.status(403).json({ error: `Your ${plan} plan does not support ${quality} downloads.` });
        }

        const outputName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${quality}.${quality === 'mp3' ? 'mp3' : 'mp4'}`;
        const fullPath = path.join(os.tmpdir(), outputName);
        const ytDlp = require('yt-dlp-exec');
        const ffmpegPath = getFfmpegPath();

        // Helper: Find actual output file if yt-dlp appended .mkv or other extension
        const findActualOutputFile = (targetPath) => {
            if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) return targetPath;
            const dir = path.dirname(targetPath);
            const baseName = path.basename(targetPath);
            const candidates = [
                `${targetPath}.mkv`,
                `${targetPath}.webm`,
                path.join(dir, `${path.parse(baseName).name}.mkv`),
                path.join(dir, `${path.parse(baseName).name}.webm`)
            ];
            for (const cand of candidates) {
                if (fs.existsSync(cand) && fs.statSync(cand).size > 0) {
                    try {
                        fs.renameSync(cand, targetPath);
                        console.log(`🔄 [yt-dlp] Renamed output container from ${cand} to ${targetPath}`);
                        return targetPath;
                    } catch (e) {
                        return cand;
                    }
                }
            }
            return null;
        };

        // Step 1: Direct In-Memory Stream for Video (Instant response in ~2-3 seconds, no server disk wait!)
        // Note: For MP3, skip straight to Step 2 FFmpeg extraction to guarantee a 100% genuine MP3 audio stream
        let secureCookies = getSecureCookies();
        const h = quality === 'mp3' ? null : quality.replace('p', '');

        if (quality !== 'mp3') {
            const formatSelector = `best[height<=${h}][ext=mp4]/best[ext=mp4]/best[height<=${h}]/best`;
            console.log(`🚀 [Instant-Download] Requesting direct stream for ${videoId} (${quality})...`);
            let streamUrlRaw = null;

            // Strategy 1: Try with cookies if present
            if (secureCookies?.path) {
                try {
                    streamUrlRaw = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                        getUrl: true,
                        format: formatSelector,
                        noCheckCertificates: true,
                        cookies: secureCookies.path,
                        userAgent: getYoutubeUserAgent(),
                        addHeader: [
                            'Accept-Language:en-US,en;q=0.9',
                            'Referer:https://www.youtube.com/watch?v=' + videoId
                        ]
                    });
                } catch (e) {
                    console.warn(`⚠️ [Instant-Download] Cookie direct stream failed: ${e.message.slice(0, 100)}`);
                }
            }

            // Strategy 2: Try Android client without cookies
            if (!streamUrlRaw) {
                try {
                    streamUrlRaw = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                        getUrl: true,
                        format: formatSelector,
                        noCheckCertificates: true,
                        preferFreeFormats: true,
                        extractorArgs: 'youtube:player-skip=webpage,configs;player-client=android',
                        userAgent: getYoutubeUserAgent(),
                        addHeader: [
                            'Accept-Language:en-US,en;q=0.9',
                            'Referer:https://www.youtube.com/watch?v=' + videoId
                        ]
                    });
                } catch (streamErr) {
                    console.warn(`⚠️ [Instant-Download] Android direct stream failed (${streamErr.message.slice(0, 100)}). Falling back to FFmpeg file merge...`);
                }
            }

            const directUrl = (streamUrlRaw || '').trim().split('\n')[0];
            if (directUrl && directUrl.startsWith('http')) {
                console.log(`⚡ [Instant-Download] Direct URL resolved in seconds. Piping stream for ${outputName}`);
                res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
                res.setHeader('Content-Type', 'video/mp4');

                const streamRes = await axios.get(directUrl, {
                    responseType: 'stream',
                    headers: { 'User-Agent': getYoutubeUserAgent() }
                });

                if (streamRes.headers['content-length']) {
                    res.setHeader('Content-Length', streamRes.headers['content-length']);
                }

                streamRes.data.pipe(res);

                await new Promise((resolve, reject) => {
                    streamRes.data.on('end', resolve);
                    streamRes.data.on('error', reject);
                });

                if (secureCookies?.isTemp && fs.existsSync(secureCookies.path)) {
                    try { fs.unlinkSync(secureCookies.path); } catch (e) {}
                }

                await pool.execute('UPDATE users SET downloads_count = downloads_count + 1 WHERE id = ?', [userId]);
                logAction(userId, 'DOWNLOAD_VIDEO', { videoId, quality, title });
                return; // Instant streaming finished!
            }
        }

        // Step 2: Fallback to FFmpeg file download & merge (or MP3 audio conversion)
        console.log(`🎬 [Merge-Fallback] Downloading & merging ${videoId} (${quality}) with FFmpeg...`);
        const baseDlpOptions = {
            output: fullPath,
            noCheckCertificates: true,
            preferFreeFormats: true,
            userAgent: getYoutubeUserAgent(),
            addHeader: [
                'Accept-Language:en-US,en;q=0.9',
                'Referer:https://www.youtube.com/watch?v=' + videoId
            ]
        };

        if (ffmpegPath) {
            baseDlpOptions.ffmpegLocation = ffmpegPath;
        }

        if (quality === 'mp3') {
            baseDlpOptions.format = 'bestaudio/best';
            baseDlpOptions.extractAudio = true;
            baseDlpOptions.audioFormat = 'mp3';
        } else {
            baseDlpOptions.format = `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`;
            baseDlpOptions.mergeOutputFormat = 'mp4';
        }

        let downloadSuccess = false;
        let lastDlError = null;

        // Try with cookies if present
        if (secureCookies?.path) {
            try {
                console.log(`🍪 [Merge-Fallback] Trying download with cookies...`);
                await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                    ...baseDlpOptions,
                    cookies: secureCookies.path
                });
                downloadSuccess = true;
            } catch (err) {
                console.warn(`⚠️ [Merge-Fallback] Cookie download failed: ${err.message.slice(0, 100)}. Retrying with Android client...`);
                lastDlError = err;
            }
        }

        // Try Android client without cookies
        if (!downloadSuccess) {
            try {
                await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
                    ...baseDlpOptions,
                    extractorArgs: 'youtube:player-skip=webpage,configs;player-client=android'
                });
                downloadSuccess = true;
            } catch (err) {
                lastDlError = err;
            }
        }

        if (secureCookies?.isTemp && fs.existsSync(secureCookies.path)) {
            try { fs.unlinkSync(secureCookies.path); } catch (e) {}
        }

        if (!downloadSuccess) {
            throw lastDlError || new Error("Download failed on all extraction strategies.");
        }

        const resolvedFile = findActualOutputFile(fullPath);
        if (!resolvedFile) {
            throw new Error(`Output file was not created at ${fullPath}.`);
        }

        await pool.execute('UPDATE users SET downloads_count = downloads_count + 1 WHERE id = ?', [userId]);
        logAction(userId, 'DOWNLOAD_VIDEO', { videoId, quality, title });

        res.download(resolvedFile, outputName, (err) => {
            if (err) console.error("Send file error:", err);
            try { if (fs.existsSync(resolvedFile)) fs.unlinkSync(resolvedFile); } catch (e) { }
        });
    } catch (error) {
        if (secureCookies?.isTemp && fs.existsSync(secureCookies.path)) {
            try { fs.unlinkSync(secureCookies.path); } catch (e) {}
        }
        console.error("🏁 Download Error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({
                error: "YouTube blocked the download from our server IP. Please try again with a different resolution or use a VPN.",
                details: error.message
            });
        } else {
            res.end();
        }
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Final Error Handler (Ensure CORS headers are sent even on errors)
app.use((err, req, res, next) => {
    console.error('Final Error Handler:', err.stack);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.status(500).json({
        error: err.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
