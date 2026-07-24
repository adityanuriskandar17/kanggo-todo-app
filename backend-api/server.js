require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend Kanggo API siap!' });
});

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Ini halaman yang dilindungi. Kamu sudah login.', user: req.user });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

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
