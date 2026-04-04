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
  user: process.env.DB_USER || 'aip_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aipcore_db',
  password: process.env.DB_PASSWORD || 'aip_password_123',
  port: process.env.DB_PORT || 5434,
});

// Initialize Database Tables
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                wallet_address TEXT PRIMARY KEY,
                username TEXT,
                telegram_id BIGINT,
                node_id BIGINT UNIQUE,
                aip_coins BIGINT DEFAULT 0,
                total_taps BIGINT DEFAULT 0,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;

            CREATE TABLE IF NOT EXISTS referrals (
                id SERIAL PRIMARY KEY,
                referrer_node_id BIGINT,
                guest_username TEXT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title TEXT,
                reward_coins BIGINT,
                link TEXT
            );
        `);
        console.log('Database tables initialized.');
    } catch (err) {
        console.error('Error initializing database:', err);
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
    const { address, username, telegram_id, node_id, coins, taps } = req.body;
    try {
        const query = `
            INSERT INTO users (wallet_address, username, telegram_id, node_id, aip_coins, total_taps, last_synced)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) DO UPDATE 
            SET aip_coins = $5, total_taps = $6, last_synced = CURRENT_TIMESTAMP, 
                telegram_id = EXCLUDED.telegram_id,
                node_id = EXCLUDED.node_id,
                username = EXCLUDED.username
            RETURNING *;
        `;
        const result = await pool.query(query, [address, username, telegram_id, node_id, coins, taps]);
        res.json(result.rows[0]);
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

// Referral Tracking: Record a guest click/join
app.post('/api/referrals/click', async (req, res) => {
    const { referrer_id, guest_username } = req.body;
    if (!referrer_id) return res.status(400).json({ error: 'Missing referrer_id' });
    try {
        await pool.query(
            'INSERT INTO referrals (referrer_node_id, guest_username) VALUES ($1, $2)',
            [referrer_id, guest_username || 'Guest']
        );
        res.json({ success: true });
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

app.listen(port, () => {
    console.log(`AIPCore Backend running on port ${port}`);
});

// Initialize Telegram Bot Engine
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (botToken) {
    const bot = new TelegramBot(botToken, { polling: true });
    
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🚀 Launch AIPCore Dashboard',
                            web_app: { url: 'https://nfengine.online' }
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

        bot.sendMessage(
            chatId, 
            'Welcome to the *AIPCORE Ecosystem*! 🦾\n\nTap the button below to launch your Web3 Mini App Dashboard and start managing your nodes.', 
            opts
        );
    });

    bot.on('polling_error', (error) => {
        console.error('Polling Error:', error.message); 
    });

    console.log('Telegram Bot polling service initialized.');
} else {
    console.warn('WARNING: No TELEGRAM_BOT_TOKEN found in .env, bot cannot start.');
}
