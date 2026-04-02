const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
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
                aip_coins BIGINT DEFAULT 0,
                total_taps BIGINT DEFAULT 0,
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;

            CREATE TABLE IF NOT EXISTS referrals (
                id SERIAL PRIMARY KEY,
                referrer_address TEXT REFERENCES users(wallet_address),
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
    const { address, username, telegram_id, coins, taps } = req.body;
    try {
        const query = `
            INSERT INTO users (wallet_address, username, telegram_id, aip_coins, total_taps, last_synced)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) DO UPDATE 
            SET aip_coins = $4, total_taps = $5, last_synced = CURRENT_TIMESTAMP, 
                telegram_id = EXCLUDED.telegram_id,
                username = EXCLUDED.username
            RETURNING *;
        `;
        const result = await pool.query(query, [address, username, telegram_id, coins, taps]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`AIPCore Backend running on port ${port}`);
});
