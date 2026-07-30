# Tutorial Membuat Kanggo Todo App dengan Sequelize ORM

Tutorial ini akan memandu kamu membangun **Kanggo Todo App** — aplikasi manajemen tugas berbasis web dengan autentikasi JWT. Berbeda dengan versi sebelumnya yang menggunakan **raw MySQL queries**, tutorial ini menggunakan **Sequelize ORM** (Object-Relational Mapping) untuk interaksi database.

**Stack:** Express.js + Sequelize (backend), React 19 + Vite + Tailwind CSS (frontend), MySQL (database).

---

## Daftar Isi

1. [Apa itu Sequelize & Mengapa ORM?](#1-apa-itu-sequelize--mengapa-orm)
2. [Inisialisasi Project](#2-inisialisasi-project)
3. [Database (schema.sql)](#3-database-schemasql)
4. [Backend — Sequelize](#4-backend--sequelize)
   - [4.1 package.json & Instalasi](#41-packagejson--instalasi)
   - [4.2 config/db.js — Koneksi Sequelize](#42-configdbjs--koneksi-sequelize)
   - [4.3 models/User.js — Model User](#43-modelsuserjs--model-user)
   - [4.4 models/Task.js — Model Task](#44-modelstaskjs--model-task)
   - [4.5 models/index.js — Setup Asosiasi](#45-modelsindexjs--setup-asosiasi)
   - [4.6 middleware/auth.js — JWT Middleware](#46-middlewareauthjs--jwt-middleware)
   - [4.7 routes/auth.js — Endpoint Autentikasi (Sequelize)](#47-routesauthjs--endpoint-autentikasi-sequelize)
   - [4.8 routes/tasks.js — Endpoint CRUD Tugas (Sequelize)](#48-routestasksjs--endpoint-crud-tugas-sequelize)
   - [4.9 server.js — Entry Point dengan sync()](#49-serverjs--entry-point-dengan-sync)
   - [4.10 Testing dengan Jest (Sequelize)](#410-testing-dengan-jest-sequelize)
   - [4.11 Dockerfile & .dockerignore Backend](#411-dockerfile--dockerignore-backend)
5. [Frontend](#5-frontend)
6. [Postman Collection](#6-postman-collection)
7. [Deployment](#7-deployment)
8. [Perbandingan: Raw MySQL vs Sequelize](#8-perbandingan-raw-mysql-vs-sequelize)

---

## 1. Apa itu Sequelize & Mengapa ORM?

**Sequelize** adalah Node.js ORM (Object-Relational Mapping) untuk database SQL (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL). ORM memungkinkan kita berinteraksi dengan database menggunakan **objek JavaScript** alih-alih menulis query SQL mentah.

### Keuntungan Sequelize dibanding Raw MySQL:

| Aspek | Raw MySQL (`mysql2`) | Sequelize ORM |
|-------|---------------------|---------------|
| **Query** | Menulis SQL string manual | Method JavaScript (`findAll`, `create`, dll) |
| **Model** | Tidak ada definisi model | Model dengan tipe data, validasi, hooks |
| **Asosiasi** | Foreign key manual | `hasMany`, `belongsTo` otomatis |
| **Migrasi** | Buat tabel via SQL | `sync()` atau migrasi formal |
| **Validasi** | Validasi manual di route | Validasi built-in di model |
| **Keamanan** | Prepared statements manual | Query parameter otomatis (anti SQL injection) |
| **Timestamps** | Buat kolom `created_at` manual | `timestamps: true` — otomatis |

### Perubahan dari versi Raw MySQL:

1. **Koneksi:** `mysql2/promise` pool → `Sequelize` instance
2. **Query:** `pool.query('SELECT * FROM users WHERE email = ?', [email])` → `User.findOne({ where: { email } })`
3. **Insert:** `INSERT INTO users ...` → `User.create({ ... })`
4. **Update:** `UPDATE users SET ...` → `User.update({ ... }, { where: ... })`
5. **Delete:** `DELETE FROM users ...` → `User.destroy({ where: ... })`
6. **Tabel:** Buat manual di SQL atau `CREATE TABLE` → `sequelize.sync()`
7. **Timestamps:** Manual `created_at`/`updated_at` → Auto oleh Sequelize
8. **Foreign key:** Manual `FOREIGN KEY` → `User.hasMany(Task)` / `Task.belongsTo(User)`

---

## 2. Inisialisasi Project

Buat folder project:

```bash
mkdir kanggo-todo-app-sequelize
cd kanggo-todo-app-sequelize
```

Struktur akhir project (perhatikan folder `models/` yang baru):

```
kanggo-todo-app-sequelize/
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
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   └── Task.js
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

Template untuk konfigurasi environment. Salin ke `.env` lalu isi nilainya.

---

## 3. Database (schema.sql)

File ini tetap ada sebagai referensi, tapi **tidak perlu dijalankan**. Sequelize akan membuat tabel secara otomatis melalui `sequelize.sync()`.

```sql
CREATE DATABASE IF NOT EXISTS kanggo_db;
USE kanggo_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

> **Catatan:** Perbedaan dengan versi raw MySQL ada di tabel `users` — versi Sequelize menambahkan kolom `updated_at` agar sesuai dengan `timestamps: true`.

---

## 4. Backend — Sequelize

### 4.1 package.json & Instalasi

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
    "mysql2": "^3.12.0",
    "sequelize": "^6.37.5"
  },
  "devDependencies": {
    "jest": "^30.4.2",
    "supertest": "^7.2.2"
  }
}
```

**Perubahan dari versi raw MySQL:**
- `+ "sequelize": "^6.37.5"` — ORM utama
- `"mysql2"` tetap ada — Sequelize membutuhkan mysql2 sebagai driver dialect untuk MySQL
- `"mysql2"` (dulu sebagai driver utama, sekarang sebagai driver untuk Sequelize)

```bash
cd backend-api
npm install
```

---

### 4.2 config/db.js — Koneksi Sequelize

**Perbedaan:** Dulu menggunakan `mysql2/promise` dengan `createPool`, sekarang menggunakan constructor `Sequelize`.

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'kanggo_db',
  process.env.DB_USER || 'bosani',
  process.env.DB_PASSWORD || '1234567890',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
```

**Penjelasan:**
- `Sequelize` constructor menerima: `database`, `user`, `password`, lalu object `options`
- `dialect: 'mysql'` — memberitahu Sequelize untuk menggunakan driver mysql2
- `logging: false` — matikan log SQL di console (berguna untuk development, bisa di-aktifkan dengan `logging: console.log`)
- `freezeTableName: true` — mencegah Sequelize membuat plural dari nama tabel (misal `users` tetap `users`, bukan `userses`)
- `pool` — konfigurasi connection pool (max 10 koneksi, sama seperti versi raw MySQL)
- Tidak perlu `waitForConnections` — Sequelize mengelola pool secara internal

---

### 4.3 models/User.js — Model User

**Ini adalah file BARU** yang tidak ada di versi raw MySQL.

```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
  },
});

module.exports = User;
```

**Penjelasan:**

**Field definitions:**
- `id` — `INTEGER`, `primaryKey: true`, `autoIncrement: true` (sama dengan `INT AUTO_INCREMENT PRIMARY KEY`)
- `nama` — `STRING(100)`, `allowNull: false` (sama dengan `VARCHAR(100) NOT NULL`)
- `email` — `STRING(100)`, `allowNull: false`, `unique: true` (sama dengan `VARCHAR(100) NOT NULL UNIQUE`)
- `password` — `STRING(255)`, `allowNull: false` (sama dengan `VARCHAR(255) NOT NULL`)

**Options:**
- `tableName: 'users'` — Sequelize otomatis akan menggunakan nama model dalam bentuk plural (`Users`), kita override agar tetap `users`
- `timestamps: true` — Sequelize akan **otomatis** menambahkan kolom `createdAt` dan `updatedAt` (tipe `DATETIME`). Di versi raw MySQL, kita membuat `created_at` secara manual.
  - Di MySQL, kolom akan bernama `createdAt` dan `updatedAt` (camelCase). Bisa diubah ke snake_case dengan `underscored: true`
- `hooks.beforeCreate` — **Hook** yang dijalankan SEBELUM data disimpan ke database. Di sini kita hash password dengan bcrypt.

**Perbedaan dengan versi raw MySQL:**
- Dulu: hash password dilakukan **manual di route** (`bcrypt.hash(password, 10)` sebelum `INSERT`)
- Sekarang: hash password dilakukan **otomatis di model hook** → route tidak perlu memanggil `bcrypt.hash()`
- Dulu: validasi dilakukan manual di route (cek panjang nama, format email, dll)
- Sekarang: validasi bisa ditambahkan di model (opsional) + tetap di route untuk response yang lebih baik

---

### 4.4 models/Task.js — Model Task

**File BARU** lainnya.

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'done'),
    defaultValue: 'pending',
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

module.exports = Task;
```

**Penjelasan:**

**Field definitions:**
- `id` — Primary key auto increment
- `title` — `STRING(255) NOT NULL`
- `description` — `TEXT`, nullable
- `status` — `ENUM('pending', 'in-progress', 'done')` dengan default `'pending'`
- `deadline` — `DATEONLY` (hanya tanggal, tanpa waktu — cocok untuk deadline)
- `user_id` — `INTEGER NOT NULL` dengan `references` ke tabel `users`

**Perbedaan dengan versi raw MySQL:**
- Dulu: foreign key hanya didefinisikan di SQL (`FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)
- Sekarang: foreign key didefinisikan di model (`references: { model: 'users', key: 'id' }`)
- `ON DELETE CASCADE` akan ditambahkan nanti di asosiasi (models/index.js)

---

### 4.5 models/index.js — Setup Asosiasi

**File BARU** — menghubungkan model User dan Task dengan relasi.

```javascript
const User = require('./User');
const Task = require('./Task');

User.hasMany(Task, {
  foreignKey: 'user_id',
  as: 'tasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = { User, Task };
```

**Penjelasan:**

**`User.hasMany(Task)`:**
- Satu User memiliki banyak Task
- `foreignKey: 'user_id'` — kolom di tabel `tasks` yang menjadi foreign key
- `onDelete: 'CASCADE'` — jika user dihapus, semua task-nya ikut terhapus
- `as: 'tasks'` — alias untuk include (contoh: `User.findAll({ include: 'tasks' })`)

**`Task.belongsTo(User)`:**
- Satu Task dimiliki oleh satu User
- `foreignKey: 'user_id'` — kolom foreign key yang sama
- `as: 'user'` — alias untuk include

**Mengapa asosiasi dipisah di `index.js`?**
- Menghindari circular dependency (User butuh Task, Task butuh User)
- Lebih terstruktur: definisi model di file masing-masing, relasi di `index.js`
- Mudah di-maintain

---

### 4.6 middleware/auth.js — JWT Middleware

**SAMA PERSIS** dengan versi raw MySQL — tidak ada perubahan.

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

---

### 4.7 routes/auth.js — Endpoint Autentikasi (Sequelize)

**Perubahan besar:** Semua `pool.query()` diganti dengan method Sequelize (`User.create`, `User.findOne`).

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
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

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ field: 'email', message: errors.emailExists });

    // Password di-hash OTOMATIS oleh hook beforeCreate di model User
    const user = await User.create({
      nama: nama.trim(),
      email,
      password,
    });

    const token = jwt.sign(
      { id: user.id, nama: user.nama, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil.',
      user: { id: user.id, nama: user.nama, email: user.email },
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

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: errors.emailPasswordWrong });

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

**Perubahan dari versi raw MySQL:**

| Operasi | Raw MySQL | Sequelize |
|---------|-----------|-----------|
| Import | `const pool = require('../config/db')` | `const { User } = require('../models')` |
| Cek email duplikat | `pool.query('SELECT id FROM users WHERE email = ?', [email])` | `User.findOne({ where: { email } })` |
| Buat user | `pool.query('INSERT INTO users ...')` + `bcrypt.hash()` | `User.create({ ... })` — hash di hook! |
| Ambil ID baru | `result.insertId` | `user.id` (property objek) |
| Cari user login | `pool.query('SELECT * FROM users WHERE email = ?')` | `User.findOne({ where: { email } })` |

> **PENTING:** Perhatikan bahwa `User.create()` tidak perlu memanggil `bcrypt.hash()` karena sudah di-handle oleh `hooks.beforeCreate` di model. Jika route tetap memanggil `bcrypt.hash()`, password akan di-hash DUA KALI!

---

### 4.8 routes/tasks.js — Endpoint CRUD Tugas (Sequelize)

Semua query manual diganti dengan method Sequelize: `findAll`, `findOne`, `create`, `update`, `destroy`, `findAndCountAll`.

```javascript
const express = require('express');
const { Op } = require('sequelize');
const { Task } = require('../models');
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

    const where = { user_id: req.user.id };

    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      where.title = { [Op.like]: `%${search.trim()}%` };
    }

    const { rows, count } = await Task.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      tasks: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Gagal mengambil daftar tugas.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
    res.json({ task });
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

    const task = await Task.create({
      title: title.trim(),
      description: description || null,
      status: taskStatus,
      deadline: deadline || null,
      user_id: req.user.id,
    });

    res.status(201).json({ message: 'Tugas berhasil dibuat.', task });
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ message: 'Gagal membuat tugas.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }

    const { title, description, status, deadline } = req.body;

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

    await Task.update(
      {
        title: newTitle.trim(),
        description: newDescription,
        status: newStatus,
        deadline: newDeadline,
      },
      { where: { id: req.params.id, user_id: req.user.id } }
    );

    const updated = await Task.findByPk(req.params.id);
    res.json({ message: 'Tugas berhasil diperbarui.', task: updated });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: 'Gagal memperbarui tugas.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (deleted === 0) {
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

**Perubahan Detail:**

#### GET `/` — Daftar Tugas dengan Filter, Search, Pagination

**Raw MySQL:**
```javascript
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
```

**Sequelize:**
```javascript
const where = { user_id: req.user.id };

if (status && validStatuses.includes(status)) {
  where.status = status;
}

if (search && search.trim()) {
  where.title = { [Op.like]: `%${search.trim()}%` };
}

const { rows, count } = await Task.findAndCountAll({
  where,
  order: [['createdAt', 'DESC']],
  limit,
  offset,
});
```

**Keuntungan Sequelize:**
- `findAndCountAll` mengembalikan `{ rows, count }` sekaligus — tidak perlu dua query terpisah
- `where` adalah object JavaScript, bukan string SQL — lebih aman dari SQL injection
- `order: [['createdAt', 'DESC']]` — lebih readable daripada `ORDER BY created_at DESC`
- Parameter limit/offset langsung di method, tidak perlu placeholder `?`

#### GET `/:id` — Detail Tugas

**Raw MySQL:**
```javascript
const [rows] = await pool.query(
  'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
  [req.params.id, req.user.id]
);
if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
res.json({ task: rows[0] });
```

**Sequelize:**
```javascript
const task = await Task.findOne({
  where: { id: req.params.id, user_id: req.user.id },
});
if (!task) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
res.json({ task });
```

#### POST `/` — Buat Tugas

**Raw MySQL:**
```javascript
const [result] = await pool.query(
  'INSERT INTO tasks (title, description, status, deadline, user_id) VALUES (?, ?, ?, ?, ?)',
  [title.trim(), description || null, taskStatus, deadline || null, req.user.id]
);

const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
res.status(201).json({ message: 'Tugas berhasil dibuat.', task: task[0] });
```

**Sequelize:**
```javascript
const task = await Task.create({
  title: title.trim(),
  description: description || null,
  status: taskStatus,
  deadline: deadline || null,
  user_id: req.user.id,
});

res.status(201).json({ message: 'Tugas berhasil dibuat.', task });
```

**Keuntungan:** `Task.create()` langsung mengembalikan objek task lengkap dengan id yang sudah terisi — tidak perlu query SELECT ulang!

#### PUT `/:id` — Update Tugas

**Raw MySQL:**
```javascript
const [existing] = await pool.query(
  'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
  [req.params.id, req.user.id]
);
if (existing.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

// ... validasi ...

await pool.query(
  'UPDATE tasks SET title = ?, description = ?, status = ?, deadline = ? WHERE id = ? AND user_id = ?',
  [newTitle.trim(), newDescription, newStatus, newDeadline, req.params.id, req.user.id]
);

const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
res.json({ message: 'Tugas berhasil diperbarui.', task: updated[0] });
```

**Sequelize:**
```javascript
const task = await Task.findOne({
  where: { id: req.params.id, user_id: req.user.id },
});
if (!task) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

// ... validasi ...

await Task.update(
  { title: newTitle.trim(), description: newDescription, status: newStatus, deadline: newDeadline },
  { where: { id: req.params.id, user_id: req.user.id } }
);

const updated = await Task.findByPk(req.params.id);
res.json({ message: 'Tugas berhasil diperbarui.', task: updated });
```

> **Catatan:** `findByPk(id)` adalah shortcut untuk `findOne({ where: { id } })`.

#### DELETE `/:id` — Hapus Tugas

**Raw MySQL:**
```javascript
const [result] = await pool.query(
  'DELETE FROM tasks WHERE id = ? AND user_id = ?',
  [req.params.id, req.user.id]
);
if (result.affectedRows === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
```

**Sequelize:**
```javascript
const deleted = await Task.destroy({
  where: { id: req.params.id, user_id: req.user.id },
});
if (deleted === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
```

**Keuntungan:** `destroy()` mengembalikan jumlah baris yang dihapus (integer), bukan objek `affectedRows`.

#### Operator Sequelize (`Op`)

Di bagian search, kita menggunakan `Op.like`:

```javascript
const { Op } = require('sequelize');

// ...
where.title = { [Op.like]: `%${search.trim()}%` };
```

**Operator umum di Sequelize:**

| Operator | SQL | Deskripsi |
|----------|-----|-----------|
| `[Op.eq]` | `=` | Sama dengan |
| `[Op.ne]` | `!=` | Tidak sama |
| `[Op.like]` | `LIKE` | Pencarian pattern |
| `[Op.in]` | `IN` | Dalam array |
| `[Op.between]` | `BETWEEN` | Antara dua nilai |
| `[Op.gt]` / `[Op.gte]` | `>` / `>=` | Lebih besar |
| `[Op.lt]` / `[Op.lte]` | `<` / `<=` | Lebih kecil |
| `[Op.and]` | `AND` | Logika AND |
| `[Op.or]` | `OR` | Logika OR |

---

### 4.9 server.js — Entry Point dengan sync()

**Perubahan:** Import model, panggil `sequelize.sync()` — tidak perlu membuat tabel manual.

```javascript
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db');
const { User, Task } = require('./models');
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
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    // Sinkronisasi model ke database (membuat tabel jika belum ada)
    await sequelize.sync({ alter: false });
    console.log('Model tersinkronisasi. Tabel siap.');
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

**Perubahan dari versi raw MySQL:**

| Aspek | Raw MySQL | Sequelize |
|-------|-----------|-----------|
| **Import database** | `const pool = require('./config/db')` | `const sequelize = require('./config/db')` |
| **Import model** | Tidak ada | `const { User, Task } = require('./models')` |
| **Cek koneksi** | `pool.getConnection()` | `sequelize.authenticate()` |
| **Buat tabel** | 2x `CREATE TABLE IF NOT EXISTS` manual | `sequelize.sync()` |

**Penjelasan:**

1. **`sequelize.authenticate()`** — Mengecek apakah koneksi ke database berhasil. Jika gagal, server tidak akan jalan.

2. **`sequelize.sync({ alter: false })`** — Sinkronisasi model ke database:
   - `sync()` tanpa opsi: buat tabel jika belum ada (tidak mengubah tabel yang sudah ada)
   - `sync({ alter: true })`: sesuaikan tabel dengan model (tambah kolom baru, ubah tipe data, dll) — **hati-hati di production**
   - `sync({ force: true })`: DROP tabel dulu, lalu buat ulang — **jangan dipakai di production, data hilang!**

3. **Tidak perlu `conn.release()`** — Sequelize mengelola koneksi secara otomatis.

4. **Tabel dibuat otomatis** — Sequelize membaca definisi model (User, Task) dan membuat tabel yang sesuai:
   ```sql
   -- Dibuat otomatis oleh sequelize.sync()
   CREATE TABLE IF NOT EXISTS `users` (
     `id` INTEGER NOT NULL auto_increment,
     `nama` VARCHAR(100) NOT NULL,
     `email` VARCHAR(100) NOT NULL UNIQUE,
     `password` VARCHAR(255) NOT NULL,
     `createdAt` DATETIME NOT NULL,
     `updatedAt` DATETIME NOT NULL,
     PRIMARY KEY (`id`)
   );

   CREATE TABLE IF NOT EXISTS `tasks` (
     `id` INTEGER NOT NULL auto_increment,
     `title` VARCHAR(255) NOT NULL,
     `description` TEXT,
     `status` ENUM('pending', 'in-progress', 'done') DEFAULT 'pending',
     `deadline` DATE,
     `user_id` INTEGER NOT NULL,
     `createdAt` DATETIME NOT NULL,
     `updatedAt` DATETIME NOT NULL,
     PRIMARY KEY (`id`),
     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
   );
   ```

> **Catatan:** Nama kolom timestamp di Sequelize adalah `createdAt` dan `updatedAt` (camelCase), bukan `created_at`/`updated_at`. Jika ingin menggunakan snake_case, tambahkan `underscored: true` di definisi model.

---

### 4.10 Testing dengan Jest (Sequelize)

**Perubahan:** Import model, bersihkan data dengan `User.destroy()`.

```javascript
const request = require('supertest');
const { app, init } = require('../server');
const { User } = require('../models');

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await User.destroy({ where: { email: ['test-%@test.com'] } });
});

afterAll(async () => {
  await User.destroy({
    where: { email: { [require('sequelize').Op.like]: 'test-%@test.com' } },
  });
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

**Perubahan dari versi raw MySQL:**

| Aspek | Raw MySQL | Sequelize |
|-------|-----------|-----------|
| **Import cleanup** | `const pool = require('../config/db')` | `const { User } = require('../models')` |
| **Bersihkan data** | `pool.query('DELETE FROM users WHERE email LIKE ?', ['test-%@test.com'])` | `User.destroy({ where: { email: { [Op.like]: 'test-%@test.com' } } })` |
| **Tutup koneksi** | `await pool.end()` | Tidak perlu (Sequelize handle sendiri) |

Versi Sequelize juga bisa membersihkan dengan `User.destroy({ where: {}, truncate: true })` untuk menghapus semua data.

Jalankan test:

```bash
cd backend-api
NODE_ENV=test npm test
```

---

### 4.11 Dockerfile & .dockerignore Backend

**Sama dengan versi raw MySQL — tidak ada perubahan.**

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

**.dockerignore:**

```
node_modules
npm-debug.log
__tests__
.env
```

---

## 5. Frontend

**TIDAK ADA PERUBAHAN.** Frontend tetap sama persis karena API response-nya identik (struktur JSON yang dikembalikan sama).

Silakan lihat [TUTORIAL.md](TUTORIAL.md) bagian 4 untuk detail frontend, atau salin file-file berikut dari project versi raw MySQL:

- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/main.jsx`
- `frontend/src/api/axios.js`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Navbar.test.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/components/ConfirmModal.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/TaskForm.jsx`
- `frontend/src/App.jsx`
- `frontend/src/test/setup.js`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

---

## 6. Postman Collection

**TIDAK ADA PERUBAHAN.** Collection Postman tetap sama karena struktur API tidak berubah.

Lihat [TUTORIAL.md](TUTORIAL.md) bagian 5 untuk detail Postman collection.

---

## 7. Deployment

**Sama dengan versi raw MySQL — tidak ada perubahan.**

### Docker Compose

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

Jalankan:

```bash
docker compose up -d
```

---

## 8. Perbandingan: Raw MySQL vs Sequelize

### Tabel Perbandingan Lengkap

| File | Raw MySQL | Sequelize |
|------|-----------|-----------|
| **package.json** | `mysql2` sebagai dep | `sequelize` + `mysql2` (driver) |
| **config/db.js** | `mysql.createPool()` | `new Sequelize()` |
| **models/User.js** | ❌ Tidak ada | `sequelize.define('User', ...)` dengan hook bcrypt |
| **models/Task.js** | ❌ Tidak ada | `sequelize.define('Task', ...)` |
| **models/index.js** | ❌ Tidak ada | `User.hasMany(Task)`, `Task.belongsTo(User)` |
| **routes/auth.js** | `pool.query('INSERT INTO ...')` | `User.create()` (hash di hook) |
| **routes/auth.js** | `pool.query('SELECT ...')` cek email | `User.findOne({ where: { email } })` |
| **routes/tasks.js** | `pool.query(...)` semua operasi | `Task.findAll`, `findOne`, `create`, `update`, `destroy` |
| **routes/tasks.js** | 2 query terpisah (COUNT + SELECT) | `findAndCountAll()` 1 method |
| **server.js** | `CREATE TABLE IF NOT EXISTS` manual | `sequelize.sync()` otomatis |
| **server.js** | `pool.getConnection()` untuk cek | `sequelize.authenticate()` |
| **__tests__/auth.test.js** | `pool.query('DELETE ...')` | `User.destroy({ where: ... })` |

### Contoh Mapping Query

| Operasi SQL | Raw MySQL | Sequelize |
|-------------|-----------|-----------|
| `SELECT * FROM users WHERE email = ?` | `pool.query('SELECT ... WHERE email = ?', [email])` | `User.findOne({ where: { email } })` |
| `INSERT INTO users ... VALUES ...` | `pool.query('INSERT INTO users ...', [...])` | `User.create({ nama, email, password })` |
| `UPDATE tasks SET title=? WHERE id=? AND user_id=?` | `pool.query('UPDATE tasks SET ...', [...])` | `Task.update({ title }, { where: { id, user_id } })` |
| `DELETE FROM tasks WHERE id=?` | `pool.query('DELETE FROM tasks WHERE id=?', [id])` | `Task.destroy({ where: { id } })` |
| `SELECT COUNT(*) as total FROM tasks WHERE ...` | `pool.query('SELECT COUNT(*) ...', params)` | `Task.count({ where })` atau `findAndCountAll()` |
| `SELECT * FROM tasks LIMIT ? OFFSET ?` | `pool.query('SELECT * ... LIMIT ? OFFSET ?', [...])` | `Task.findAll({ limit, offset })` |

### Kelebihan Sequelize

1. **Produktivitas:** Tidak perlu menulis SQL string — method JavaScript lebih cepat ditulis dan dibaca
2. **Keamanan:** Query parameter otomatis, tidak ada risiko SQL injection
3. **Portabilitas:** Ganti database (MySQL → PostgreSQL) hanya dengan mengganti `dialect`
4. **Validasi:** Built-in validasi di model (tipe data, panjang, format)
5. **Hooks:** `beforeCreate`, `afterUpdate`, dll — otomatisasi logic (seperti hash password)
6. **Asosiasi:** Relasi antar tabel didefinisikan sekali, Sequelize handle JOIN
7. **Migrasi:** Formal migration system untuk perubahan skema database
8. **Eager/Lazy loading:** `include` untuk JOIN otomatis

### Kekurangan Sequelize

1. **Performance overhead:** ORM selalu lebih lambat daripada raw query (tapi untuk kebanyakan aplikasi, perbedaannya tidak signifikan)
2. **Complex query:** Query yang sangat kompleks kadang lebih mudah ditulis dalam SQL murni
3. **Learning curve:** Perlu belajar konsep ORM, method, options
4. **Debugging:** Kadang sulit melacak query SQL yang dihasilkan Sequelize (aktifkan `logging: console.log` untuk debugging)

### Kapan Pakai Raw SQL vs ORM?

| Situasi | Rekomendasi |
|---------|-------------|
| Aplikasi kecil/sederhana | ORM (Sequelize) — lebih cepat develop |
| Aplikasi kompleks dengan banyak relasi | ORM — lebih mudah manage asosiasi |
| Query berat dengan JOIN kompleks | Raw SQL atau Sequelize dengan raw query |
| Performance kritis | Raw SQL — kendali penuh atas query |
| Tim dengan developer junior | ORM — mengurangi risiko SQL injection |
| Migration database | Sequelize — migration system built-in |

---

## Kesimpulan

Kamu telah membangun **Kanggo Todo App** menggunakan **Sequelize ORM**! Perbedaan utama dari versi raw MySQL:

1. **Folder baru `models/`** — berisi definisi model User, Task, dan setup asosiasi
2. **`config/db.js`** — menggunakan `Sequelize` constructor, bukan `mysql2/promise`
3. **`server.js`** — `sequelize.authenticate()` + `sequelize.sync()`, bukan `CREATE TABLE` manual
4. **`routes/auth.js`** — `User.create()` / `User.findOne()`, hash password otomatis di model hook
5. **`routes/tasks.js`** — `Task.findAll()` / `findAndCountAll()` / `create()` / `update()` / `destroy()`
6. **`__tests__/auth.test.js`** — `User.destroy()` untuk cleanup, bukan `pool.query('DELETE ...')`
7. **Frontend** — **tidak ada perubahan** karena API response identik

Selamat, kamu sekarang memahami dua pendekatan: **raw SQL** dan **ORM**! Kamu bisa memilih pendekatan yang sesuai untuk project selanjutnya.
