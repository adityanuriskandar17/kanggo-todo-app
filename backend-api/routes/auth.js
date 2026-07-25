const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const authLimiter = process.env.NODE_ENV === 'test' ? null : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login/register. Coba lagi dalam 15 menit.' },
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const errors = {
  namaRequired: 'Nama wajib diisi.',
  namaMin: 'Nama minimal 2 karakter.',
  emailRequired: 'Email wajib diisi.',
  emailInvalid: 'Format email tidak valid.',
  passwordRequired: 'Password wajib diisi.',
  passwordMin: 'Password minimal 6 karakter.',
  emailPasswordRequired: 'Email dan password wajib diisi.',
  emailPasswordWrong: 'Email atau password salah.',
  emailExists: 'Email sudah terdaftar.',
};

const authLimiterMw = authLimiter || ((req, res, next) => next());

router.post('/register', authLimiterMw, async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    if (!nama || !nama.trim()) return res.status(400).json({ field: 'nama', message: errors.namaRequired });
    if (nama.trim().length < 2) return res.status(400).json({ field: 'nama', message: errors.namaMin });
    if (!email) return res.status(400).json({ field: 'email', message: errors.emailRequired });
    if (!validateEmail(email)) return res.status(400).json({ field: 'email', message: errors.emailInvalid });
    if (!password) return res.status(400).json({ field: 'password', message: errors.passwordRequired });
    if (password.length < 6) return res.status(400).json({ field: 'password', message: errors.passwordMin });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ field: 'email', message: errors.emailExists });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
      [nama.trim(), email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, nama: nama.trim(), email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil.',
      user: { id: result.insertId, nama: nama.trim(), email },
      token,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

router.post('/login', authLimiterMw, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: errors.emailPasswordRequired });
    if (!validateEmail(email)) return res.status(400).json({ field: 'email', message: errors.emailInvalid });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: errors.emailPasswordWrong });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: errors.emailPasswordWrong });

    const token = jwt.sign(
      { id: user.id, nama: user.nama, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil.',
      user: { id: user.id, nama: user.nama, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout berhasil. Silakan hapus token di sisi client.' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
