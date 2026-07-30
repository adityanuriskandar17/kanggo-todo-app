# Tutorial Membuat Kanggo Todo App dari Nol

Tutorial ini akan memandu kamu membangun **Kanggo Todo App** — aplikasi manajemen tugas berbasis web dengan autentikasi JWT. Stack yang digunakan: **Express.js** (backend), **React + Vite + Tailwind CSS** (frontend), dan **MySQL** (database).

---

## Daftar Isi

1. [Inisialisasi Project](#1-inisialisasi-project)
2. [Database (schema.sql)](#2-database-schemasql)
3. [Backend](#3-backend)
   - [package.json & Instalasi](#31-packagejson--instalasi)
   - [config/db.js — Koneksi MySQL](#32-configdbjs--koneksi-mysql)
   - [middleware/auth.js — JWT Middleware](#33-middlewareauthjs--jwt-middleware)
   - [routes/auth.js — Endpoint Autentikasi](#34-routesauthjs--endpoint-autentikasi)
   - [routes/tasks.js — Endpoint CRUD Tugas](#35-routestasksjs--endpoint-crud-tugas)
   - [server.js — Entry Point](#36-serverjs--entry-point)
   - [Testing dengan Jest](#37-testing-dengan-jest)
   - [Dockerfile & .dockerignore Backend](#38-dockerfile--dockerignore-backend)
4. [Frontend](#4-frontend)
   - [package.json & Instalasi](#41-packagejson--instalasi)
   - [vite.config.js — Konfigurasi Vite](#42-viteconfigjs--konfigurasi-vite)
   - [index.html — Entry HTML](#43-indexhtml)
   - [src/index.css — Tailwind CSS](#44-srcindexcss)
   - [src/main.jsx — Entry React](#45-srcmainjsx)
   - [src/api/axios.js — Axios Instance & Interceptor](#46-srcapiaxiosjs)
   - [src/components/Navbar.jsx](#47-navbar)
   - [src/components/ProtectedRoute.jsx](#48-protectedroute)
   - [src/components/ConfirmModal.jsx](#49-confirmmodal)
   - [src/pages/Login.jsx](#410-login)
   - [src/pages/Register.jsx](#411-register)
   - [src/pages/Dashboard.jsx](#412-dashboard)
   - [src/pages/TaskForm.jsx](#413-taskform)
   - [src/App.jsx — Routing](#414-appjsx)
   - [Testing dengan Vitest](#415-testing-dengan-vitest)
   - [Dockerfile & .dockerignore Frontend](#416-dockerfile-frontend)
5. [Postman Collection](#5-postman-collection)
6. [Deployment](#6-deployment)

---

## 1. Inisialisasi Project

Buat folder project:

```bash
mkdir kanggo-todo-app
cd kanggo-todo-app
```

Struktur akhir project:

```
kanggo-todo-app/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── schema.sql
├── README.md
├── backend-api/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── tasks.js
│   └── __tests__/
│       └── auth.test.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Navbar.test.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── ConfirmModal.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   └── TaskForm.jsx
│       └── test/
│           └── setup.js
└── postman/
    ├── kanggo-api.postman_collection.json
    └── kanggo-api.postman_environment.json
```

### File .gitignore

```gitignore
# .gitignore
node_modules/
dist/
.env
*.log
.DS_Store
```

Menghindari file tidak perlu masuk Git: `node_modules`, folder build (`dist/`), file environment (`.env`), dan file sistem.

### File .env.example

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_DATABASE=kanggo_db

JWT_SECRET=
API_PORT=3000

NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Template untuk konfigurasi environment. Salin ke `.env` lalu isi nilainya. `JWT_SECRET` wajib diisi dengan string acak. `CORS_ORIGIN` adalah URL frontend.

---

## 2. Database (schema.sql)

```sql
CREATE DATABASE IF NOT EXISTS kanggo_db;
USE kanggo_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in-progress', 'done') DEFAULT 'pending',
  deadline DATE,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Penjelasan

**Tabel `users`:**
- `id` — Primary key auto increment
- `nama` — Nama user, maksimal 100 karakter
- `email` — Email unik (tidak boleh duplikat)
- `password` — Hash password (bcrypt), 255 karakter
- `created_at` — Otomatis terisi waktu registrasi

**Tabel `tasks`:**
- `id` — Primary key auto increment
- `title` — Judul tugas, wajib diisi
- `description` — Deskripsi opsional (TEXT)
- `status` — Enum: `pending` (default), `in-progress`, `done`
- `deadline` — Tanggal deadline (tipe DATE)
- `user_id` — Foreign key ke `users.id`, dengan `ON DELETE CASCADE` (jika user dihapus, semua tugasnya ikut terhapus)
- `created_at` / `updated_at` — Timestamp otomatis

Jalankan:

```bash
mysql -u root -p < schema.sql
```

Atau biarkan tabel dibuat otomatis oleh backend (lihat `server.js`).

---

## 3. Backend

### 3.1 package.json & Instalasi

```json
{
  "name": "backend-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node --experimental-vm-modules node_modules/.bin/jest --detectOpenHandles"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^8.6.0",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.11.0",
    "mysql2": "^3.12.0"
  },
  "devDependencies": {
    "jest": "^30.4.2",
    "supertest": "^7.2.2"
  }
}
```

**Dependencies:**
- `express` — Framework web
- `cors` — Mengizinkan request dari domain lain
- `helmet` — Keamanan HTTP headers
- `morgan` — Logger HTTP
- `dotenv` — Membaca file `.env`
- `mysql2` — Driver MySQL dengan Promise
- `bcryptjs` — Hash password
- `jsonwebtoken` — Membuat/verifikasi JWT
- `express-rate-limit` — Rate limiting

**DevDependencies:**
- `jest` — Testing framework
- `supertest` — HTTP assertion untuk testing

```bash
cd backend-api
npm install
```

### 3.2 config/db.js — Koneksi MySQL

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'bosani',
  password: process.env.DB_PASSWORD || '1234567890',
  database: process.env.DB_DATABASE || 'kanggo_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

**Penjelasan:**
- Menggunakan `mysql2/promise` agar bisa `async/await`
- `dotenv.config` dipanggil dua kali untuk fleksibilitas path `.env`
- `createPool` membuat connection pool (koneksi otomatis dikelola)
- `connectionLimit: 10` — maksimal 10 koneksi simultan
- Fallback value jika env var tidak terisi

### 3.3 middleware/auth.js — JWT Middleware

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kanggo-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
```

**Penjelasan:**
- Mengambil token dari header `Authorization: Bearer <token>`
- Jika tidak ada token → `401 Unauthorized`
- `jwt.verify()` memverifikasi token — jika expired/tidak valid → `403 Forbidden`
- Jika valid, data user (id, nama, email) disimpan di `req.user`
- `next()` melanjutkan ke handler berikutnya

### 3.4 routes/auth.js — Endpoint Autentikasi

```javascript
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
```

**Penjelasan per bagian:**

**Rate Limiter (`authLimiter`):**
- Maksimal 10 request per 15 menit untuk endpoint auth
- Dinonaktifkan saat mode `test` agar testing tidak terblokir

**POST `/register`:**
1. Validasi input: nama (required, min 2 chars), email (required, format), password (required, min 6 chars)
2. Cek email sudah terdaftar atau belum
3. Hash password dengan `bcrypt.hash(password, 10)` — salt rounds 10
4. Simpan user ke database
5. Buat JWT dengan payload `{ id, nama, email }`, berlaku 7 hari
6. Return 201 dengan token

**POST `/login`:**
1. Validasi email dan password wajib ada
2. Cari user berdasarkan email
3. Bandingkan password dengan `bcrypt.compare()`
4. Jika cocok, buat JWT dan return
5. Error message sengaja dibuat sama ("Email atau password salah") agar tidak memberi petunjuk mana yang salah

**POST `/logout`:**
- Karena JWT stateless, logout hanya mengembalikan pesan sukses
- Client bertugas menghapus token dari localStorage

**GET `/me`:**
- Mengembalikan data user dari token (diekstrak oleh middleware `authenticateToken`)

### 3.5 routes/tasks.js — Endpoint CRUD Tugas

```javascript
const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

function isValidDate(dateStr) {
  if (!dateStr) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}

function isBackdate(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const validStatuses = ['pending', 'in-progress', 'done'];

    let where = 'WHERE user_id = ?';
    let params = [req.user.id];

    if (status && validStatuses.includes(status)) {
      where += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      where += ' AND title LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM tasks ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      tasks: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Gagal mengambil daftar tugas.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
    res.json({ task: rows[0] });
  } catch (err) {
    console.error('Get task detail error:', err.message);
    res.status(500).json({ message: 'Gagal mengambil tugas.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ field: 'title', message: 'Judul tugas wajib diisi.' });
    }
    if (title.trim().length > 255) {
      return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    }
    if (deadline && !isValidDate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid (YYYY-MM-DD).' });
    }
    if (isBackdate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    }

    const validStatuses = ['pending', 'in-progress', 'done'];
    const taskStatus = status && validStatuses.includes(status) ? status : 'pending';

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, deadline, user_id) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), description || null, taskStatus, deadline || null, req.user.id]
    );

    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Tugas berhasil dibuat.', task: task[0] });
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ message: 'Gagal membuat tugas.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }

    const { title, description, status, deadline } = req.body;
    const task = existing[0];

    const newTitle = title !== undefined ? title : task.title;
    const newDescription = description !== undefined ? description : task.description;
    const newDeadline = deadline !== undefined ? deadline : task.deadline;

    if (!newTitle || !newTitle.trim()) {
      return res.status(400).json({ field: 'title', message: 'Judul tugas tidak boleh kosong.' });
    }
    if (newTitle.trim().length > 255) {
      return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    }
    if (deadline !== undefined && deadline !== null && deadline !== '' && !isValidDate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid (YYYY-MM-DD).' });
    }
    if (deadline !== undefined && deadline !== null && deadline !== '' && isBackdate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    }

    const validStatuses = ['pending', 'in-progress', 'done'];
    const newStatus = status && validStatuses.includes(status) ? status : task.status;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, deadline = ? WHERE id = ? AND user_id = ?',
      [newTitle.trim(), newDescription, newStatus, newDeadline, req.params.id, req.user.id]
    );

    const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tugas berhasil diperbarui.', task: updated[0] });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: 'Gagal memperbarui tugas.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
    res.json({ message: 'Tugas berhasil dihapus.' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Gagal menghapus tugas.' });
  }
});

module.exports = router;
```

**Penjelasan:**

`router.use(authenticateToken)` — Semua endpoint tasks butuh autentikasi.

**Fungsi pembantu:**
- `isValidDate()` — Memvalidasi format YYYY-MM-DD dan tanggal valid
- `isBackdate()` — Mengecek apakah deadline lebih kecil dari hari ini (hari ini di-set ke 00:00:00)

**GET `/` — Daftar tugas dengan filter, search, pagination:**
- Query params: `status`, `search`, `page`, `limit`
- `page` minimal 1, `limit` antara 1-100
- Filter status hanya menerima `pending`, `in-progress`, `done`
- Search menggunakan `LIKE` pada kolom title
- Mengembalikan data tugas dan object `pagination` (page, limit, total, totalPages)
- Hanya menampilkan tugas milik user yang login (`WHERE user_id = ?`)

**GET `/:id` — Detail tugas:**
- Cek kepemilikan (id + user_id)
- 404 jika tidak ditemukan

**POST `/` — Buat tugas:**
- Validasi title (required, max 255)
- Validasi deadline (format + backdate)
- Status default `pending` jika tidak valid
- Deadline dan description bisa null

**PUT `/:id` — Update tugas:**
- Cek kepemilikan terlebih dahulu
- Partial update: field yang tidak dikirim tetap menggunakan nilai lama
- Validasi sama seperti create

**DELETE `/:id` — Hapus tugas:**
- Cek kepemilikan via `AND user_id = ?`
- `affectedRows === 0` berarti tidak ada data yang dihapus → 404

### 3.6 server.js — Entry Point

```javascript
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
```

**Penjelasan:**

1. **Security:** `helmet()` + `app.disable('x-powered-by')` — menyembunyikan informasi Express
2. **CORS:** Di development mengizinkan `localhost:5173` dan `localhost:3000`. Di production membaca dari env `CORS_ORIGIN`
3. **Body parser:** `express.json({ limit: '10kb' })` — batasi ukuran body 10KB
4. **Logging:** `morgan` — `dev` untuk development, `combined` untuk production
5. **Rate limit global:** 100 request per 15 menit untuk semua endpoint `/api/`
6. **Routes:** Auth dan tasks dipasang di `/api/auth` dan `/api/tasks`
7. **Error handler:** Catch semua error yang tidak tertangani
8. **Fungsi `init()`:** Membuat tabel secara otomatis jika belum ada. Dipanggil saat server start (`require.main === module`)
9. **Export:** `{ app, init }` untuk keperluan testing

### 3.7 Testing dengan Jest

```javascript
const request = require('supertest');
const { app, init } = require('../server');
const pool = require('../config/db');

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE ?', ['test-%@test.com']);
  await pool.end();
});

describe('POST /api/auth/register', () => {
  const validUser = {
    nama: 'Test User',
    email: `test-${Date.now()}@test.com`,
    password: '123456',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registrasi berhasil.');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.nama).toBe(validUser.nama);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
    expect(res.body.message).toBe('Email sudah terdaftar.');
  });

  it('should reject empty nama', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: '', email: 'test-empty@test.com', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('nama');
    expect(res.body.message).toBe('Nama wajib diisi.');
  });

  it('should reject nama < 2 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'A', email: 'test-short@test.com', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('nama');
    expect(res.body.message).toBe('Nama minimal 2 karakter.');
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Test', email: 'not-an-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('email');
    expect(res.body.message).toBe('Format email tidak valid.');
  });

  it('should reject password < 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Test', email: 'test-shortpw@test.com', password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
    expect(res.body.message).toBe('Password minimal 6 karakter.');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('field');
    expect(res.body).toHaveProperty('message');
  });
});
```

**Penjelasan:**
- `beforeAll` — inisialisasi database (membuat tabel) sebelum test
- `afterAll` — bersihkan data test, tutup pool koneksi
- Menggunakan `supertest` untuk simulasi HTTP request ke Express app langsung (tanpa perlu server jalan)
- Menggunakan email unik (`Date.now()`) agar tidak konflik setiap kali test dijalankan
- 7 test cases: sukses, duplikat email, nama kosong, nama terlalu pendek, email tidak valid, password pendek, field kosong

Jalankan test:

```bash
cd backend-api
NODE_ENV=test npm test
```

### 3.8 Dockerfile & .dockerignore Backend

**Dockerfile:**

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

- `node:20-alpine` — image Node ringan
- `npm ci --omit=dev` — instal hanya production dependencies (lebih cepat, lebih aman)

**.dockerignore:**

```
node_modules
npm-debug.log
__tests__
.env
```

- `__tests__` tidak perlu masuk image production
- `.env` jangan ikut ke image

---

## 4. Frontend

### 4.1 package.json & Instalasi

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "axios": "^1.18.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "jsdom": "^29.1.1",
    "lucide-react": "^1.26.0",
    "oxlint": "^1.71.0",
    "react-router-dom": "^7.18.1",
    "tailwindcss": "^4.3.3",
    "vite": "^8.1.1",
    "vitest": "^4.1.10"
  }
}
```

**Dependencies:**
- `axios` — HTTP client
- `react` / `react-dom` — React 19

**DevDependencies:**
- `vite` + `@vitejs/plugin-react` — Build tool
- `tailwindcss` + `@tailwindcss/vite` — CSS utility framework
- `react-router-dom` — Routing
- `lucide-react` — Icons
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` — Testing
- `oxlint` — Linter (pengganti ESLint yang lebih cepat)

```bash
cd frontend
npm install
```

### 4.2 vite.config.js — Konfigurasi Vite

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

**Penjelasan:**
- `plugins: [react(), tailwindcss()]` — plugin React + Tailwind (Tailwind versi 4 menggunakan Vite plugin, bukan PostCSS)
- `server.proxy` — Semua request ke `/api` diteruskan ke `localhost:3000` (backend). Ini menghindari CORS di development
- `test` — Konfigurasi Vitest: environment `jsdom`, global functions aktif, setup file untuk jest-dom

### 4.3 index.html

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Kanggo Todo App - Aplikasi manajemen tugas harian dengan autentikasi JWT, CRUD tugas, filter, dan pencarian." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="Kanggo Todo App" />
    <meta property="og:description" content="Aplikasi manajemen tugas harian dengan autentikasi JWT, CRUD tugas, filter, dan pencarian." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://todo.adityanuriskandar.com" />
    <meta name="twitter:card" content="summary" />
    <link rel="canonical" href="https://todo.adityanuriskandar.com" />
    <title>Kanggo Todo App</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Kanggo Todo App",
        "url": "https://todo.adityanuriskandar.com",
        "description": "Aplikasi manajemen tugas harian dengan autentikasi JWT, CRUD tugas, filter, dan pencarian.",
        "applicationCategory": "Task Management",
        "operatingSystem": "All"
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Penjelasan:**
- `lang="id"` — Bahasa Indonesia
- Meta tags untuk SEO: description, robots, Open Graph (OG), Twitter Card
- `link rel="canonical"` — URL kanonikal
- `application/ld+json` — Schema.org structured data (WebApplication)
- `script type="module"` — Entry point React

### 4.4 src/index.css

```css
@import "tailwindcss";
```

Satu baris ini sudah cukup untuk Tailwind CSS versi 4. Semua utility classes langsung tersedia.

### 4.5 src/main.jsx

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Entry point standar React 19. `StrictMode` membantu mendeteksi potensi masalah.

### 4.6 src/api/axios.js

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if ((err.response?.status === 401 || err.response?.status === 403) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

**Penjelasan:**

**Request interceptor:**
- Sebelum request dikirim, ambil token dari localStorage
- Set header `Authorization: Bearer <token>`

**Response interceptor:**
- Jika response 401/403 DAN user masih punya token (berarti token expired/invalid)
- Hapus token dan user dari localStorage
- Redirect ke `/login`
- Ini memastikan user yang tokennya expired langsung diarahkan ke halaman login

### 4.7 Navbar

```jsx
import { LogOut, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
            <ClipboardList className="w-6 h-6 text-blue-600 shrink-0" />
          <span className="font-bold text-lg sm:text-xl text-gray-800 truncate">Kanggo Todo App</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-gray-600">
              Halo, <span className="font-semibold text-gray-800">{user.nama}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
```

**Penjelasan:**
- Logo + klik → navigasi ke home (`/`)
- Jika user login: tampilkan "Halo, {nama}" dan tombol Logout
- Nama user dan label "Logout" disembunyikan di layar kecil (`hidden sm:inline`)
- `handleLogout`: hapus token & user dari localStorage, panggil `onLogout()` (update state di App), redirect ke `/login`

### 4.8 ProtectedRoute

```jsx
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

**Penjelasan:**
- Cek apakah token ada di localStorage
- Jika tidak ada, redirect ke `/login` (dengan `replace` agar tidak bisa kembali dengan tombol back)
- Jika ada, render `children` (halaman yang dilindungi)

### 4.9 ConfirmModal

```jsx
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Penjelasan:**
- `if (!open) return null` — modal tidak dirender jika `open` false
- Overlay `bg-black/40` — klik di luar modal = cancel
- Ikon `AlertTriangle` di lingkaran merah sebagai indikator bahaya
- Dua tombol: Batal (cancel) dan Hapus (confirm)
- `z-50` agar muncul di atas elemen lain

### 4.10 Login

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid.';
    if (!form.password) errs.password = 'Password wajib diisi.';
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'email') {
      if (!value) msg = 'Email wajib diisi.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid.';
    } else if (field === 'password') {
      if (!value) msg = 'Password wajib diisi.';
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Login gagal.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm mx-4 sm:mx-0">
        <div className="flex items-center justify-center gap-2 mb-6">
          <LogIn className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Masuk</h1>
        </div>

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            Masuk
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
```

**Penjelasan:**

**State:**
- `form` — email dan password
- `showPassword` — toggle visibilitas password
- `errors` — object error per field

**Validasi real-time (`handleChange` + `validateField`):**
- Setiap kali user mengetik, validasi field tersebut langsung dijalankan
- Email: wajib diisi, format regex
- Password: wajib diisi

**Submit:**
- Validasi semua field
- Kirim POST ke `/auth/login`
- Simpan token dan user ke localStorage
- Panggil `onLogin()` untuk update state di App
- Redirect ke `/`

**Error handling:**
- Jika server mengembalikan `{ field: 'email', message: '...' }`, error ditampilkan di field yang sesuai
- Error umum (non-field) ditampilkan di atas form sebagai alert merah

**Eye toggle:**
- Tombol dengan ikon `Eye`/`EyeOff` untuk show/hide password

### 4.11 Register

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ nama: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi.';
    else if (form.nama.trim().length < 2) errs.nama = 'Nama minimal 2 karakter.';
    if (!form.email) errs.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid.';
    if (!form.password) errs.password = 'Password wajib diisi.';
    else if (form.password.length < 6) errs.password = 'Password minimal 6 karakter.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Konfirmasi password tidak cocok.';
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'nama') {
      if (!value.trim()) msg = 'Nama wajib diisi.';
      else if (value.trim().length < 2) msg = 'Nama minimal 2 karakter.';
    } else if (field === 'email') {
      if (!value) msg = 'Email wajib diisi.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid.';
    } else if (field === 'password') {
      if (!value) msg = 'Password wajib diisi.';
      else if (value.length < 6) msg = 'Password minimal 6 karakter.';
      if (form.confirmPassword && value !== form.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Konfirmasi password tidak cocok.' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    } else if (field === 'confirmPassword') {
      if (value !== form.password) msg = 'Konfirmasi password tidak cocok.';
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const res = await api.post('/auth/register', {
        nama: form.nama, email: form.email, password: form.password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Registrasi gagal.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm mx-4 sm:mx-0">
        <div className="flex items-center justify-center gap-2 mb-6">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Daftar</h1>
        </div>

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama ? 'border-red-400' : 'border-gray-300'}`}
              value={form.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            Daftar
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
```

**Penjelasan:**

Sama seperti Login, dengan tambahan:

**4 fields:** Nama, Email, Password, Konfirmasi Password

**Validasi tambahan di Register:**
- Nama: required, min 2 karakter
- Password: required, min 6 karakter
- Konfirmasi password: harus sama dengan password
- Validasi konfirmasi password otomatis ter-update saat password berubah (lihat bagian `validateField` untuk `password`)

**Dua eye toggle:** satu untuk password, satu untuk confirm password

### 4.12 Dashboard

```jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Clock, CheckCircle, Circle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, class: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  'in-progress': { label: 'In Progress', icon: Clock, class: 'text-blue-500 bg-blue-50 border-blue-200' },
  done: { label: 'Done', icon: CheckCircle, class: 'text-green-500 bg-green-50 border-green-200' },
};

const statusOptions = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const fetchTasks = async (searchVal, filterVal, pageVal) => {
    setLoading(true);
    try {
      const params = { page: pageVal, limit: 10 };
      if (filterVal) params.status = filterVal;
      if (searchVal.trim()) params.search = searchVal.trim();
      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchTasks(search, filter, page);
  }, [filter, page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTasks(val, filter, 1);
    }, 300);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tasks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTasks(search, filter, page);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' +
      d.getFullYear();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tugas Saya</h1>
        <button
          onClick={() => navigate('/tugas-baru')}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Tugas
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cari tugas..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              filter === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Memuat...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada tugas.</p>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {tasks.map((task) => {
              const st = statusConfig[task.status] || statusConfig.pending;
              const Icon = st.icon;
              return (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${st.class}`}
                        >
                          <Icon className="w-3 h-3" />
                          {st.label}
                        </span>
                        {task.deadline && (
                          <span className="text-xs text-gray-500">
                            Deadline: {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => navigate(`/edit-tugas/${task.id}`)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="p-2 text-gray-500 hover:text-red-600 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Tugas"
        message={`Apakah kamu yakin ingin menghapus tugas "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

**Penjelasan:**

**State:**
- `tasks` — daftar tugas dari API
- `filter` — status filter (`''`, `pending`, `in-progress`, `done`)
- `search` — kata kunci pencarian
- `page` / `totalPages` — pagination
- `loading` — loading state
- `deleteTarget` — tugas yang akan dihapus (untuk ConfirmModal)

**statusConfig:**
- Mapping status → label, icon, dan class CSS untuk badge warna
- `pending` → kuning, `in-progress` → biru, `done` → hijau

**Debounce search (`handleSearch`):**
- Menggunakan `useRef` untuk menyimpan timeout ID
- Setiap kali input berubah, timeout sebelumnya dibatalkan
- Fetch baru dijalankan setelah 300ms tanpa perubahan
- Mencegah terlalu banyak request API saat mengetik

**useEffect:**
- `useEffect` pertama: reset page ke 1 saat filter atau search berubah
- `useEffect` kedua: fetch ulang tugas saat filter atau page berubah (search sudah ditangani oleh debounce)

**Filter buttons:**
- Tombol filter di-loop dari `statusOptions`
- Tombol aktif mendapat style `bg-blue-600 text-white`
- Klik tombol → `setFilter(opt.value)` → page reset ke 1 → fetch ulang

**Task card:**
- Menampilkan title, description (jika ada), badge status dengan icon, deadline
- Tombol Edit → navigasi ke `/edit-tugas/:id`
- Tombol Hapus → set `deleteTarget` → modal konfirmasi muncul

**Pagination:**
- Tampil hanya jika `totalPages > 1`
- Tombol Previous/Next dengan icon Chevron
- `disabled` saat di halaman pertama/terakhir
- Label "Sebelumnya" dan "Selanjutnya" hanya tampil di layar `sm:inline`

**ConfirmModal:**
- Muncul saat `deleteTarget` tidak null
- `onConfirm` → panggil `handleDelete()` → hapus via API → fetch ulang
- `onCancel` → set `deleteTarget` ke null

### 4.13 TaskForm

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../api/axios';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    deadline: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/tasks/${id}`).then((res) => {
        const task = res.data.task;
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          deadline: task.deadline ? task.deadline.split('T')[0] : '',
        });
      }).catch(() => navigate('/'));
    }
  }, [id]);

  const isBackdate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Judul tugas wajib diisi.';
    else if (form.title.trim().length > 255) errs.title = 'Judul maksimal 255 karakter.';
    if (form.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(form.deadline)) {
      errs.deadline = 'Format tanggal tidak valid (YYYY-MM-DD).';
    } else if (isBackdate(form.deadline)) {
      errs.deadline = 'Deadline tidak boleh tanggal yang sudah lewat.';
    }
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'title') {
      if (!value.trim()) msg = 'Judul tugas wajib diisi.';
      else if (value.trim().length > 255) msg = 'Judul maksimal 255 karakter.';
    } else if (field === 'deadline') {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) msg = 'Format tanggal tidak valid (YYYY-MM-DD).';
      else if (isBackdate(value)) msg = 'Deadline tidak boleh tanggal yang sudah lewat.';
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/tasks/${id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Gagal menyimpan tugas.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Tugas' : 'Tambah Tugas'}
      </h1>

      {errors.form && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Judul <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            type="date"
            min={today}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.deadline ? 'border-red-400' : 'border-gray-300'}`}
            value={form.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
          />
          {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Tugas'}
        </button>
      </form>
    </div>
  );
}
```

**Penjelasan:**

**Dual mode (Create / Edit):**
- Deteksi mode dari `useParams().id` — jika ada `id`, berarti mode edit
- `isEdit = Boolean(id)`

**Load data untuk Edit:**
- `useEffect` menjalankan GET `/tasks/:id` saat `isEdit` true
- Isi form dengan data tugas yang ada
- Deadline di-split karena API mengembalikan format ISO (`2026-08-15T00:00:00.000Z`)
- Jika gagal (misal tugas tidak ditemukan), redirect ke `/`

**Validasi:**
- Title: required, max 255 karakter
- Deadline: format YYYY-MM-DD, tidak boleh backdate (kurang dari hari ini)
- `today` dihitung dari `new Date().toISOString().split('T')[0]` → `2026-07-30`
- `min={today}` pada input date membuat tanggal sebelumnya tidak bisa dipilih di browser

**Submit:**
- POST `/tasks` untuk create, PUT `/tasks/:id` untuk update
- Loading state menonaktifkan tombol dan menampilkan "Menyimpan..."
- Error dari server ditampilkan per-field atau sebagai alert global

### 4.14 App.jsx

```jsx
import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskForm = lazy(() => import('./pages/TaskForm'));

function PageLoader() {
  return <div role="status" aria-label="Memuat" className="flex items-center justify-center min-h-[60vh] text-gray-600 text-sm">Memuat...</div>;
}

export default function App() {
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const handleLogin = () => {
    setUser(JSON.parse(localStorage.getItem('user')));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tugas-baru"
              element={
                <ProtectedRoute>
                  <TaskForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-tugas/:id"
              element={
                <ProtectedRoute>
                  <TaskForm />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
```

**Penjelasan:**

**Lazy loading:**
- `lazy(() => import('./pages/Login'))` — halaman di-load hanya saat dibutuhkan (code splitting)
- `Suspense` dengan `fallback={<PageLoader />}` — menampilkan "Memuat..." saat komponen sedang di-load

**User State:**
- Inisialisasi dari `localStorage.getItem('user')` — agar state tetap ada setelah refresh halaman
- `handleLogin` — dipanggil setelah login/register berhasil, membaca ulang user dari localStorage
- `onLogout` di Navbar — set user ke null

**Routing:**
- `/login` dan `/register` — jika user sudah login, redirect ke `/`
- `/` — Dashboard (dilindungi ProtectedRoute)
- `/tugas-baru` — Form tambah tugas (dilindungi)
- `/edit-tugas/:id` — Form edit tugas (dilindungi)
- `*` — catch-all redirect ke `/`

### 4.15 Testing dengan Vitest

**Setup file (`src/test/setup.js`):**

```javascript
import '@testing-library/jest-dom';
```

Import matchers custom dari jest-dom (contoh: `toBeInTheDocument()`).

**Navbar.test.jsx:**

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (user, onLogout = vi.fn()) => {
  return render(
    <BrowserRouter>
      <Navbar user={user} onLogout={onLogout} />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render app name', () => {
    renderNavbar(null);
    expect(screen.getByText('Kanggo Todo App')).toBeInTheDocument();
  });

  it('should show user name when logged in', () => {
    renderNavbar({ nama: 'Budi' });
    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText(/Halo,/)).toBeInTheDocument();
  });

  it('should show logout button when logged in', () => {
    renderNavbar({ nama: 'Budi' });
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should not show user info when not logged in', () => {
    renderNavbar(null);
    expect(screen.queryByText(/Halo,/)).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should call onLogout and clear storage on logout click', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', JSON.stringify({ nama: 'Budi' }));

    const onLogout = vi.fn();
    renderNavbar({ nama: 'Budi' }, onLogout);

    fireEvent.click(screen.getByText('Logout'));
    expect(onLogout).toHaveBeenCalled();
  });
});
```

**Penjelasan:**

- `renderNavbar` — helper function untuk render Navbar dengan BrowserRouter (karena Navbar menggunakan `useNavigate`)
- `vi.fn()` — membuat mock function (Vitest global function)
- 5 test cases:
  1. Render nama aplikasi
  2. Tampilkan nama user saat login
  3. Tampilkan tombol Logout saat login
  4. Sembunyikan info user saat tidak login
  5. `fireEvent.click` pada Logout → `onLogout` dipanggil

Jalankan test:

```bash
cd frontend
npm test
```

### 4.16 Dockerfile Frontend

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Multi-stage build:**
1. **Stage 1 (builder):** Install semua dependencies, build React app dengan Vite
2. **Stage 2 (nginx):** Salin hasil build (`dist/`) ke folder nginx, serve sebagai static file

**.dockerignore:**

```
node_modules
npm-debug.log
dist
.env
```

---

## 5. Postman Collection

### Collection (`postman/kanggo-api.postman_collection.json`)

Collection Postman berisi 9 endpoint yang terorganisir dalam 2 folder:

**Auth (4 endpoints):**
- `Register` — POST `/api/auth/register` — body: `{ nama, email, password }`
- `Login` — POST `/api/auth/login` — body: `{ email, password }`
- `Logout` — POST `/api/auth/logout` — header: `Authorization: Bearer {{token}}`
- `Me` — GET `/api/auth/me` — header: `Authorization: Bearer {{token}}`

**Tasks (5 endpoints):**
- `Daftar Tugas` — GET `/api/tasks?page=&limit=&status=&search=`
- `Detail Tugas` — GET `/api/tasks/{{task_id}}`
- `Buat Tugas` — POST `/api/tasks` — body: `{ title, description, status, deadline }`
- `Update Tugas` — PUT `/api/tasks/{{task_id}}`
- `Hapus Tugas` — DELETE `/api/tasks/{{task_id}}`

**Fitur:**
- Endpoint Register dan Login memiliki **Test Script** yang otomatis menyimpan token ke `collectionVariables` setelah sukses
- Semua endpoint Tasks menggunakan `{{token}}` yang sudah terisi otomatis
- Menggunakan environment variables (`{{base_url}}`, `{{email}}`, dll)

### Environment (`postman/kanggo-api.postman_environment.json`)

Variable environment yang bisa disesuaikan:

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `base_url` | `http://localhost:3000` | URL backend |
| `nama` | `John Doe` | Nama untuk register |
| `email` | `john@example.com` | Email untuk login/register |
| `password` | `123456` | Password |
| `token` | (kosong) | Token JWT (terisi otomatis) |
| `user_id` | (kosong) | ID user (terisi otomatis) |
| `task_id` | `1` | ID tugas untuk detail/update/delete |
| `task_title` | `Belajar Node.js` | Judul tugas |
| `task_description` | `Membuat REST API...` | Deskripsi tugas |
| `task_status` | `pending` | Status tugas |
| `task_deadline` | `2026-08-15` | Deadline tugas |
| `page` | `1` | Halaman pagination |
| `limit` | `10` | Limit pagination |
| `status` | (kosong) | Filter status |
| `search` | (kosong) | Kata kunci pencarian |

### Cara Pakai:
1. Buka Postman → Import → Pilih kedua file
2. Pilih environment **Kanggo API (Local)**
3. Jalankan **Register** atau **Login** (token otomatis tersimpan)
4. Endpoint Tasks siap digunakan

---

## 6. Deployment

### Docker Compose (Lokal)

```yaml
services:
  db:
    image: mysql:8.0
    container_name: kanggo-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123!
      MYSQL_DATABASE: kanggo_db
      MYSQL_USER: bosani
      MYSQL_PASSWORD: 1234567890
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot123!"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend-api
    container_name: kanggo-backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: bosani
      DB_PASSWORD: 1234567890
      DB_DATABASE: kanggo_db
      JWT_SECRET: kanggo-secret-key-2026
      API_PORT: 3000
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    container_name: kanggo-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "5173:80"

volumes:
  mysql_data:
```

**Penjelasan:**
- **db:** MySQL 8.0 dengan health check. Port 3307 di host (agar tidak bentrok dengan MySQL lokal)
- **backend:** Build dari `./backend-api`, menunggu db sehat, environment variabel di-set langsung
- **frontend:** Build dari `./frontend`, serve via nginx di port 80, di-map ke port 5173 di host
- **Volume:** `mysql_data` persist data database

Jalankan:

```bash
docker compose up -d
```

### Deployment Production

Untuk production:
1. Push image ke container registry (Docker Hub, GitHub Container Registry)
2. Deploy ke VPS / cloud VM dengan `docker compose`
3. Set `NODE_ENV=production` dan `CORS_ORIGIN=https://domainkamu.com`
4. Gunakan reverse proxy (Nginx/Traefik) dengan SSL
5. Ganti semua nilai default (password DB, JWT_SECRET) dengan nilai yang aman

---

## Kesimpulan

Kamu telah membangun **Kanggo Todo App** dari nol! Tutorial ini mencakup:

- **Database:** MySQL dengan tabel users dan tasks
- **Backend:** Express.js API dengan autentikasi JWT, CRUD tugas, validasi, rate limiting, dan testing
- **Frontend:** React 19 + Vite + Tailwind CSS dengan lazy loading, protected routes, search debounce, pagination, dan testing
- **Postman:** Collection siap pakai untuk testing API
- **Docker:** Siap di-deploy dengan satu perintah

Selamat, kamu sekarang punya aplikasi todo full-stack yang siap digunakan dan dikembangkan lebih lanjut!
