const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rate Limiter: Prevent API flooding
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all api routes
app.use('/api/', limiter);

// Database Connection
const pool = new Pool({
  user:     process.env.DB_USER     || 'aip_admin',
  host:     process.env.DB_HOST     || 'db',
  database: process.env.DB_NAME     || 'aipcore_db',
  password: process.env.DB_PASSWORD || 'aip_password_123',
  port:     Number(process.env.DB_PORT) || 5432,
  // Connection pool settings for production
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

console.log(`[DB] Connecting to ${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432} as ${process.env.DB_USER || 'aip_admin'}`);

// Initialize Database Tables (with retry for Docker startup timing)
const initDB = async (retries = 10, delay = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    wallet_address TEXT PRIMARY KEY,
                    username TEXT,
                    telegram_id BIGINT,
                    node_id BIGINT UNIQUE,
                    aip_coins BIGINT DEFAULT 0,
                    total_taps BIGINT DEFAULT 0,
                    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    node_tier BIGINT DEFAULT 0,
                    pending_sponsor_id BIGINT,
                    direct_count BIGINT DEFAULT 0
                );

                -- Auto-Migration: Ensure all columns exist for old tables
                ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS node_id BIGINT;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS aip_coins BIGINT DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS total_taps BIGINT DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS node_tier BIGINT DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_sponsor_id BIGINT;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS direct_count BIGINT DEFAULT 0;

                -- Add unique constraint for telegram_id if not exists

                -- Add unique constraint for telegram_id if not exists
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_telegram_id_key') THEN
                        ALTER TABLE users ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);
                    END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS referrals (
                    id SERIAL PRIMARY KEY,
                    referrer_node_id BIGINT,
                    guest_username TEXT,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('[DB] Tables and auto-migrations (including pending_sponsor) initialized successfully.');
            return; // success
        } catch (err) {
            if (attempt < retries) {
                console.warn(`[DB] Connection attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('[DB] All connection attempts exhausted. Database initialization failed:', err.message);
            }
        }
    }
};


initDB();

// API Routes
app.get('/api/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [address]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/sync', async (req, res) => {
    const { address, username, telegram_id, node_id, coins, taps, node_tier, pending_sponsor_id, direct_count } = req.body;
    if (!address) return res.status(400).json({ error: 'Missing address' });
    try {
        const query = `
            INSERT INTO users (wallet_address, username, telegram_id, node_id, aip_coins, total_taps, node_tier, pending_sponsor_id, direct_count, last_synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) DO UPDATE 
            SET aip_coins = GREATEST(users.aip_coins, EXCLUDED.aip_coins), 
                total_taps = GREATEST(users.total_taps, EXCLUDED.total_taps), 
                node_tier = GREATEST(users.node_tier, EXCLUDED.node_tier), 
                last_synced = CURRENT_TIMESTAMP, 
                telegram_id = COALESCE(NULLIF($3::BIGINT, NULL), users.telegram_id),
                node_id = COALESCE(NULLIF($4::BIGINT, 0)::BIGINT, users.node_id),
                username = COALESCE(NULLIF($2, ''), users.username),
                direct_count = COALESCE(NULLIF($9::BIGINT, 0)::BIGINT, users.direct_count),
                pending_sponsor_id = CASE 
                    WHEN users.node_id IS NULL OR users.node_id = 0 THEN COALESCE($8::BIGINT, users.pending_sponsor_id)
                    ELSE users.pending_sponsor_id
                END
            RETURNING *;
        `;
        const result = await pool.query(query, [
            address,
            username || null,
            telegram_id ? BigInt(telegram_id) : null,
            node_id || null,
            coins || 0,
            taps || 0,
            node_tier || 0,
            pending_sponsor_id || null,
            direct_count || 0
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Explicit Telegram Account Link (wallet -> telegram_id + username)
app.post('/api/user/link-telegram', async (req, res) => {
    const { address, telegram_id, username } = req.body;
    if (!address || !telegram_id) return res.status(400).json({ error: 'Missing address or telegram_id' });
    try {
        const result = await pool.query(`
            INSERT INTO users (wallet_address, telegram_id, username, last_synced)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) DO UPDATE
            SET telegram_id = $2,
                username = COALESCE(NULLIF($3, ''), users.username),
                last_synced = CURRENT_TIMESTAMP
            RETURNING wallet_address, telegram_id, username;
        `, [address, BigInt(telegram_id), username || null]);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by Node ID
app.get('/api/user/node/:nodeId', async (req, res) => {
    try {
        const { nodeId } = req.params;
        const result = await pool.query('SELECT username, wallet_address FROM users WHERE node_id = $1', [nodeId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Node not found in DB' });
        }
        const user = result.rows[0];
        // Ensure @ prefix for display
        if (user.username && !user.username.startsWith('@')) {
            user.username = `@${user.username}`;
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topCoins = await pool.query(`
            SELECT username, node_id, aip_coins as score, node_tier as tier, wallet_address as wallet
            FROM users 
            ORDER BY aip_coins DESC 
            LIMIT 50
        `);
        const topTiers = await pool.query(`
            SELECT username, node_id, node_tier as score, aip_coins as coins, wallet_address as wallet
            FROM users 
            WHERE node_tier > 0
            ORDER BY node_tier DESC, aip_coins DESC
            LIMIT 50
        `);
        const topDirects = await pool.query(`
            SELECT username, node_id, direct_count as score, node_tier as tier, wallet_address as wallet
            FROM users 
            WHERE direct_count > 0
            ORDER BY direct_count DESC, node_tier DESC
            LIMIT 50
        `);
        res.json({
            coins: topCoins.rows,
            tiers: topTiers.rows,
            directs: topDirects.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Activity Feed: Recent Platform Events
app.get('/api/activity', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT username, node_id, node_tier as tier, aip_coins as coins, last_synced as time
            FROM users 
            ORDER BY last_synced DESC 
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Referral Tracking: Record a guest click/join + Persistence
app.post('/api/referrals/click', async (req, res) => {
    const { referrer_id, guest_username, telegram_id, wallet_address } = req.body;
    if (!referrer_id) return res.status(400).json({ error: 'Missing referrer_id' });
    try {
        // Record click for analytics
        await pool.query(
            'INSERT INTO referrals (referrer_node_id, guest_username) VALUES ($1, $2)',
            [referrer_id, guest_username || 'Guest']
        );

        // PERSISTENCE: If we have an identifier, save the pending sponsor (Latest Click Wins)
        if (telegram_id || wallet_address) {
            const query = `
                INSERT INTO users (wallet_address, telegram_id, username, pending_sponsor_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (wallet_address) DO UPDATE SET
                    pending_sponsor_id = CASE 
                        WHEN users.node_id IS NULL OR users.node_id = 0 THEN $4::BIGINT
                        ELSE users.pending_sponsor_id
                    END,
                    telegram_id = COALESCE($2, users.telegram_id),
                    username = COALESCE($3, users.username)
                WHERE users.wallet_address IS NOT NULL;
            `;
            
            // If we don't have wallet_address but have telegram_id, we need a special UPSERT for telegram_id
            if (!wallet_address && telegram_id) {
                await pool.query(`
                    INSERT INTO users (wallet_address, telegram_id, username, pending_sponsor_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (telegram_id) DO UPDATE SET
                        pending_sponsor_id = CASE 
                            WHEN users.node_id IS NULL OR users.node_id = 0 THEN $4::BIGINT
                            ELSE users.pending_sponsor_id
                        END
                `, [`TEMP_TG_${telegram_id}`, BigInt(telegram_id), guest_username || null, BigInt(referrer_id)]);
            } else if (wallet_address) {
                await pool.query(query, [wallet_address, telegram_id ? BigInt(telegram_id) : null, guest_username || null, BigInt(referrer_id)]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Referral click error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET Pending Sponsor ID for a user
app.get('/api/user/pending-sponsor/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // ID can be telegram_id or wallet_address
        const result = await pool.query(`
            SELECT pending_sponsor_id 
            FROM users 
            WHERE telegram_id = $1 OR wallet_address = $2
            LIMIT 1
        `, [isNaN(id) ? null : BigInt(id), id]);

        if (result.rows.length > 0 && result.rows[0].pending_sponsor_id) {
            return res.json({ sponsorId: result.rows[0].pending_sponsor_id });
        }
        res.json({ sponsorId: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get referral activity for a node
app.get('/api/referrals/:nodeId', async (req, res) => {
    try {
        const { nodeId } = req.params;
        const result = await pool.query(
            'SELECT guest_username as username, joined_at as "joinedAt" FROM referrals WHERE referrer_node_id = $1 ORDER BY joined_at DESC LIMIT 50',
            [nodeId]
        );
        const countRes = await pool.query('SELECT COUNT(*) FROM referrals WHERE referrer_node_id = $1', [nodeId]);
        
        res.json({
            rawInvites: parseInt(countRes.rows[0].count) * 1.5, // Mocking "clicks" vs "joins"
            offlineJoined: parseInt(countRes.rows[0].count),
            guests: result.rows.map(r => ({
                ...r,
                joinedAt: new Date(r.joinedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check Endpoint (for Docker/VPS)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`[SERVER] AIPCore Backend running on port ${port}`);
});

// Initialize Telegram Bot Engine
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const PROD_URL = 'https://aipcore.online'; // Final production domain

if (botToken) {
    const bot = new TelegramBot(botToken, { polling: true });
    
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const startParam = match && match[1]; // Captured from /start parameter
        
        let welcomeMsg = 'Welcome to the *AIPCORE Ecosystem*! 🦾\n\nTap the button below to launch your Web3 Mini App Dashboard and start managing your nodes.';
        
        if (startParam) {
            welcomeMsg = `Welcome to the *AIPCORE Ecosystem*! 🦾\n\n🚀 *Referral Detected*: You've been invited by Node #${startParam}.\n\nTap the button below to launch your Web3 Mini App Dashboard, activate your own node, and join the matrix!`;
            console.log(`[BOT] New user via referral. Sponsor Node: ${startParam}`);
        }

        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🚀 Launch AIPCore Dashboard',
                            web_app: { url: PROD_URL }
                        }
                    ],
                    [
                        {
                            text: '💬 Join Community',
                            url: 'https://t.me/AIPCore'
                        }
                    ]
                ]
            },
            parse_mode: 'Markdown'
        };

        bot.sendMessage(chatId, welcomeMsg, opts);
    });

    bot.on('polling_error', (error) => {
        // Only log critical errors to avoid console spam
        if (!error.message.includes('EFATAL')) {
            console.warn('[BOT] Polling Notification:', error.message);
        } else {
            console.error('[BOT] Critical Error:', error.message);
        }
    });

    console.log('[BOT] Telegram Bot polling service initialized.');
} else {
    console.warn('[BOT] WARNING: No TELEGRAM_BOT_TOKEN found in .env, bot cannot start.');
}
