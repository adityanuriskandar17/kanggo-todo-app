require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.API_PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet());
app.disable('x-powered-by');

const corsOrigin = isProduction
  ? (process.env.CORS_ORIGIN || 'https://todo.adityanuriskandar.com').split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

app.use(morgan(isProduction ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});
app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'Backend Kanggo API siap!' });
});

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Ini halaman yang dilindungi. Kamu sudah login.', user: req.user });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan server.' });
});

async function init() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending','in-progress','done') DEFAULT 'pending',
        deadline DATE,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    conn.release();
    console.log('Database siap.');
  } catch (err) {
    console.error('Gagal koneksi database:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, init };
