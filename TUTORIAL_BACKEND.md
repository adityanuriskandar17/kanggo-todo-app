# Tutorial Backend Kanggo Todo App — Sequelize ORM

Tutorial ini akan memandu kamu membangun **backend** Kanggo Todo App secara lengkap menggunakan **Express.js + Sequelize ORM + MySQL**. Semua penjelasan dalam Bahasa Indonesia, step-by-step, dari nol hingga aplikasi siap dijalankan.

**Apa yang akan kamu buat:**
- REST API dengan Express.js di port 3000
- Autentikasi JWT (register, login, logout, me)
- CRUD tugas dengan kepemilikan user, filter, pencarian, pagination
- Validasi input (client + server), rate limiting, security headers (Helmet)
- Database MySQL menggunakan Sequelize ORM

---

## Daftar Isi

1. [Apa itu Sequelize & ORM?](#1-apa-itu-sequelize--orm)
2. [Inisialisasi Project & package.json](#2-inisialisasi-project--packagejson)
3. [Konfigurasi Environment (.env.example)](#3-konfigurasi-environment-envexample)
4. [Koneksi Database (config/db.js)](#4-koneksi-database-configdbjs)
5. [Model User (models/User.js)](#5-model-user-modelsuserjs)
6. [Model Task (models/Task.js)](#6-model-task-modelstaskjs)
7. [Setup Asosiasi (models/index.js)](#7-setup-asosiasi-modelsindexjs)
8. [Middleware JWT (middleware/auth.js)](#8-middleware-jwt-middlewareauthjs)
9. [Routes Autentikasi (routes/auth.js)](#9-routes-autentikasi-routesauthjs)
10. [Routes Tugas (routes/tasks.js)](#10-routes-tugas-routestasksjs)
11. [Entry Point Server (server.js)](#11-entry-point-server-serverjs)
12. [Testing dengan Jest (__tests__/auth.test.js)](#12-testing-dengan-jest-__tests__authtestjs)
13. [Dockerfile Backend](#13-dockerfile-backend)
14. [.dockerignore](#14-dockerignore)
15. [Menjalankan Aplikasi](#15-menjalankan-aplikasi)

---

## 1. Apa itu Sequelize & ORM?

**Sequelize** adalah ORM (Object-Relational Mapping) untuk Node.js yang mendukung database SQL seperti PostgreSQL, MySQL, MariaDB, SQLite, dan MSSQL.

### Kenapa ORM?

Tanpa ORM, kita menulis SQL manual:
```js
await pool.query('SELECT * FROM users WHERE email = ?', [email]);
```

Dengan ORM, kita menulis JavaScript:
```js
await User.findOne({ where: { email } });
```

### Keuntungan Sequelize

| Aspek | Tanpa ORM (Raw SQL) | Dengan Sequelize |
|-------|---------------------|------------------|
| **Query** | String SQL manual | Method JavaScript (`findAll`, `create`) |
| **Model** | Tidak ada definisi | Model dengan tipe data & validasi |
| **Relasi** | Foreign key manual | `hasMany` / `belongsTo` otomatis |
| **Migrasi** | Buat tabel via SQL | `sync()` otomatis |
| **Keamanan** | Prepared statements manual | Anti SQL injection otomatis |
| **Timestamps** | Kolom manual | `timestamps: true` — otomatis |

---

## 2. Inisialisasi Project & package.json

Buat folder `backend-api` dan inisialisasi project:

```bash
mkdir backend-api
cd backend-api
npm init -y
```

### package.json

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

**Penjelasan Dependencies:**

| Package | Fungsi |
|---------|--------|
| `express` | Framework web untuk membuat API |
| `cors` | Mengizinkan request dari domain lain (frontend) |
| `helmet` | Keamanan HTTP headers |
| `morgan` | Logger HTTP (mencatat setiap request) |
| `dotenv` | Membaca file `.env` untuk konfigurasi |
| `mysql2` | Driver MySQL — Sequelize membutuhkan ini |
| `sequelize` | ORM utama untuk interaksi database |
| `bcryptjs` | Hash password sebelum disimpan |
| `jsonwebtoken` | Membuat dan memverifikasi token JWT |
| `express-rate-limit` | Membatasi jumlah request (anti spam) |
| `jest` | Framework testing |
| `supertest` | HTTP assertion untuk testing |

> **Catatan:** `mysql2` tetap diperlukan karena Sequelize menggunakannya sebagai *dialect driver* untuk berkomunikasi dengan MySQL.

Install semua dependencies:

```bash
npm install
npm install --save-dev jest supertest
```

### Struktur Folder

Setelah selesai, struktur folder `backend-api` akan seperti ini:

```
backend-api/
├── package.json
├── server.js
├── Dockerfile
├── .dockerignore
├── config/
│   └── db.js
├── models/
│   ├── index.js
│   ├── User.js
│   └── Task.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   └── tasks.js
└── __tests__/
    └── auth.test.js
```

---

## 3. Konfigurasi Environment (.env.example)

File `.env` menyimpan konfigurasi rahasia (password, secret key) yang TIDAK boleh masuk ke Git.

Buat file `.env.example` di ROOT project (bukan di `backend-api/`):

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

**Penjelasan setiap variabel:**

| Variabel | Default | Fungsi |
|----------|---------|--------|
| `DB_HOST` | `localhost` | Alamat server MySQL |
| `DB_PORT` | `3306` | Port MySQL (default: 3306) |
| `DB_USER` | — | Username MySQL |
| `DB_PASSWORD` | — | Password MySQL |
| `DB_DATABASE` | `kanggo_db` | Nama database yang digunakan |
| `JWT_SECRET` | — | Secret key untuk menandatangani token JWT (wajib diisi!) |
| `API_PORT` | `3000` | Port untuk menjalankan server Express |
| `NODE_ENV` | `development` | Mode environment (development/production/test) |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan |

Buat file `.env` (copy dari `.env.example`) lalu isi nilainya:

```bash
cp .env.example .env
```

Isi `JWT_SECRET` dengan string acak yang panjang (minimal 32 karakter).

---

## 4. Koneksi Database (config/db.js)

File ini membuat koneksi dari aplikasi ke database MySQL menggunakan Sequelize.

```js
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

**Penjelasan setiap bagian:**

### Constructor Sequelize

```js
new Sequelize(database, username, password, { options });
```

Empat argumen:
1. `database` — Nama database (contoh: `kanggo_db`)
2. `username` — Username MySQL (contoh: `bosani`)
3. `password` — Password MySQL (contoh: `1234567890`)
4. `options` — Object konfigurasi tambahan

### Options

| Option | Nilai | Fungsi |
|--------|-------|--------|
| `host` | `localhost` | Alamat server database |
| `port` | `3306` | Port MySQL |
| `dialect` | `mysql` | Jenis database (menentukan driver yang digunakan) |
| `logging` | `false` | Jika `true`, Sequelize akan menampilkan query SQL di console |
| `freezeTableName` | `true` | Mencegah Sequelize mengubah nama tabel jadi plural (misal: `users` tetap `users`, bukan `userses`) |
| `pool.max` | `10` | Maksimal koneksi simultan |
| `pool.min` | `0` | Minimal koneksi yang dipertahankan |
| `pool.acquire` | `30000` | Waktu maksimal (ms) untuk mendapat koneksi |
| `pool.idle` | `10000` | Waktu maksimal (ms) koneksi idle sebelum ditutup |

### dotenv.config

Kita panggil `dotenv.config()` dua kali:
- `path: '../.env'` — jika file `.env` di folder parent (root project)
- `path: '.env'` — jika file `.env` di folder yang sama (backend-api/)

Ini memberikan fleksibilitas dimana pun `.env` diletakkan.

### Fallback Values

Setiap variabel punya nilai fallback (default). Contoh:
```js
process.env.DB_DATABASE || 'kanggo_db'
```
Artinya: "Gunakan nilai dari `DB_DATABASE` di file `.env`, tapi jika tidak ada, gunakan `'kanggo_db'`."

Ini penting agar aplikasi tetap bisa jalan meskipun file `.env` belum dikonfigurasi sempurna.

---

## 5. Model User (models/User.js)

Model adalah representasi tabel database dalam bentuk JavaScript. Setiap model mewarisi method Sequelize seperti `create()`, `findOne()`, `findAll()`, dll.

```js
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

### sequelize.define('NamaModel', { fields }, { options })

Method ini mendefinisikan model baru. Parameter:
1. `'User'` — Nama model (Sequelize akan menggunakan ini untuk membuat nama tabel jika `tableName` tidak di-set)
2. `{ fields }` — Definisi kolom database
3. `{ options }` — Konfigurasi tambahan

### Field Definitions

Setiap field adalah object dengan properti:

| Field | Type | Properti | SQL Equivalent |
|-------|------|----------|----------------|
| `id` | `INTEGER` | `primaryKey: true, autoIncrement: true` | `INT AUTO_INCREMENT PRIMARY KEY` |
| `nama` | `STRING(100)` | `allowNull: false` | `VARCHAR(100) NOT NULL` |
| `email` | `STRING(100)` | `allowNull: false, unique: true` | `VARCHAR(100) NOT NULL UNIQUE` |
| `password` | `STRING(255)` | `allowNull: false` | `VARCHAR(255) NOT NULL` |

**Tipe Data Umum di Sequelize:**

| Sequelize Type | SQL Type | Keterangan |
|---------------|----------|------------|
| `DataTypes.INTEGER` | `INT` | Angka bulat |
| `DataTypes.STRING(n)` | `VARCHAR(n)` | String dengan panjang maksimal |
| `DataTypes.TEXT` | `TEXT` | Teks panjang |
| `DataTypes.DATEONLY` | `DATE` | Tanggal (tanpa waktu) |
| `DataTypes.ENUM('a','b')` | `ENUM('a','b')` | Pilihan terbatas |
| `DataTypes.BOOLEAN` | `TINYINT(1)` | Boolean |

### Options

**`tableName: 'users'`**
- Sequelize secara default akan membuat nama tabel dengan plural dari nama model (`Users`)
- Kita override agar tetap `users`

**`timestamps: true`**
- Sequelize OTOMATIS menambahkan dua kolom:
  - `createdAt` (DATETIME) — terisi saat data dibuat
  - `updatedAt` (DATETIME) — terisi saat data diupdate
- Tidak perlu membuat kolom `created_at` / `updated_at` manual

### Hooks — beforeCreate

**Hook** adalah fungsi yang dijalankan secara otomatis pada event tertentu dalam siklus hidup model.

```js
hooks: {
  beforeCreate: async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  },
}
```

**`beforeCreate`** dijalankan SEBELUM data disimpan ke database. Di sini kita:
1. Menerima object `user` yang akan disimpan
2. Mengubah `user.password` menjadi versi yang sudah di-hash
3. `bcrypt.hash(password, 10)` — salt rounds 10 (semakin tinggi, semakin aman tapi lambat)

**Keuntungan hook:**
- Route tidak perlu memanggil `bcrypt.hash()` — otomatis dijalankan
- Password TIDAK PERNAH disimpan dalam bentuk plain text
- Logic terpusat di model, tidak tersebar di route

> **PENTING:** Karena hashing dilakukan di hook `beforeCreate`, route register cukup memanggil `User.create({ nama, email, password })` — TIDAK perlu `bcrypt.hash()` lagi. Jika route tetap memanggil `bcrypt.hash()`, password akan di-hash DUA KALI!

---

## 6. Model Task (models/Task.js)

```js
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

### Field Details

| Field | Type | Properti | SQL Equivalent |
|-------|------|----------|----------------|
| `id` | `INTEGER` | PK, Auto Increment | `INT AUTO_INCREMENT PRIMARY KEY` |
| `title` | `STRING(255)` | NOT NULL | `VARCHAR(255) NOT NULL` |
| `description` | `TEXT` | nullable | `TEXT` |
| `status` | `ENUM(...)` | default `'pending'` | `ENUM('pending','in-progress','done') DEFAULT 'pending'` |
| `deadline` | `DATEONLY` | nullable | `DATE` |
| `user_id` | `INTEGER` | NOT NULL, references users | `INT NOT NULL` |

### DATEONLY vs DATE

- `DATEONLY` — Menyimpan **tanggal saja** (contoh: `2026-07-30`). Cocok untuk deadline karena kita tidak perlu waktu.
- `DATE` — Menyimpan tanggal DAN waktu (contoh: `2026-07-30 14:30:00`).

### references

```js
user_id: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'users',
    key: 'id',
  },
}
```

Ini memberi tahu Sequelize bahwa kolom `user_id` merujuk ke kolom `id` di tabel `users`. Sequelize akan membuat foreign key constraint di database.

Namun, **ON DELETE CASCADE** (menghapus task otomatis jika user dihapus) akan kita atur di file `models/index.js` melalui asosiasi.

---

## 7. Setup Asosiasi (models/index.js)

File ini menghubungkan model User dan Task sehingga Sequelize tahu relasi antar tabel.

```js
const User = require('./User');
const Task = require('./Task');

User.hasMany(Task, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Task.belongsTo(User, {
  foreignKey: 'user_id',
});

module.exports = { User, Task };
```

**Penjelasan:**

### Relasi One-to-Many

Satu User bisa memiliki banyak Task. Dalam diagram database:

```
users (1) ──── (N) tasks
```

### User.hasMany(Task)

Ini mendefinisikan relasi **dari sisi User**:
- Satu User memiliki banyak Task
- `foreignKey: 'user_id'` — Kolom di tabel `tasks` yang menjadi foreign key
- `onDelete: 'CASCADE'` — Jika user dihapus, SEMUA task milik user itu ikut terhapus

### Task.belongsTo(User)

Ini mendefinisikan relasi **dari sisi Task**:
- Satu Task dimiliki oleh satu User
- `foreignKey: 'user_id'` — Kolom foreign key (sama dengan di atas)

### Kenapa dipisah di index.js?

Kita memisahkan asosiasi ke file `index.js` karena:
1. **Circular dependency:** Jika User.js meng-require Task.js dan Task.js meng-require User.js, terjadi circular dependency (saling membutuhkan)
2. **Struktur lebih rapi:** Definisi model di file masing-masing, relasi di file terpisah
3. **Mudah di-maintain:** Tinggal buka `index.js` untuk melihat semua relasi

### Method yang tersedia setelah asosiasi

Setelah asosiasi dibuat, Sequelize menambahkan beberapa method khusus:

**Dari User:**
```js
const user = await User.findByPk(1);
const tasks = await user.getTasks();     // Ambil semua task user
const count = await user.countTasks();   // Hitung jumlah task
```

**Dari Task:**
```js
const task = await Task.findByPk(1);
const user = await task.getUser();       // Ambil user pemilik task
```

---

## 8. Middleware JWT (middleware/auth.js)

Middleware adalah fungsi yang dijalankan SEBELUM handler route. Middleware JWT memeriksa apakah request memiliki token yang valid.

File ini TIDAK berubah dengan penggunaan Sequelize — JWT bekerja secara independen dari database.

```js
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

### Cara Kerja JWT

1. Client login → Server membuat token → Client menyimpan token (di localStorage)
2. Setiap request ke endpoint yang dilindungi, client mengirim token di header:
   ```
   Authorization: Bearer <token>
   ```
3. Middleware mengambil token, memverifikasi, dan jika valid, data user dimasukkan ke `req.user`

### Alur Middleware

```
Request → authenticateToken → (jika valid) → next() → Route Handler
                            → (jika tidak)  → 401/403 response
```

### Kode per Bagian

**Mengambil token dari header:**
```js
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
```
Header `Authorization` format: `Bearer eyJhbGciOiJIUzI1NiIs...`
`split(' ')` menghasilkan `['Bearer', 'eyJhbGciOiJIUzI1NiIs...']`
Kita ambil index `[1]` (token-nya).

**Jika token tidak ada:**
```js
if (!token) {
  return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
}
```
401 = Unauthorized (belum login).

**Verifikasi token:**
```js
const decoded = jwt.verify(token, JWT_SECRET);
req.user = decoded;
next();
```
- `jwt.verify()` memeriksa keaslian token menggunakan `JWT_SECRET`
- Jika token expired atau tidak valid, throw error → masuk ke catch
- Jika valid, `decoded` berisi payload yang kita simpan saat login: `{ id, nama, email }`
- `req.user = decoded` — menyimpan data user di object request
- `next()` — lanjut ke handler route

**Jika token tidak valid:**
```js
return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
```
403 = Forbidden (token ada tapi tidak valid).

### Kapan pakai 401 vs 403?

- **401 (Unauthorized):** Token tidak dikirim sama sekali → "Kamu siapa?"
- **403 (Forbidden):** Token dikirim tapi salah/expired → "Kamu dikenal tapi tidak diizinkan"

---

## 9. Routes Autentikasi (routes/auth.js)

Routes ini menangani registrasi, login, logout, dan profile user.

Ini adalah file yang paling berubah dengan Sequelize — semua `pool.query()` diganti dengan method Sequelize.

```js
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

**Penjelasan per Bagian:**

### Import Berbeda dengan Raw SQL

| Dulu (Raw SQL) | Sekarang (Sequelize) |
|----------------|---------------------|
| `const pool = require('../config/db')` | `const { User } = require('../models')` |
| `pool.query('SELECT ...')` | `User.findOne(...)` |
| `pool.query('INSERT ...')` | `User.create(...)` |

### Rate Limiter (`authLimiter`)

```js
const authLimiter = process.env.NODE_ENV === 'test' ? null : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Terlalu banyak percobaan login/register. Coba lagi dalam 15 menit.' },
});
```

- `windowMs: 15 * 60 * 1000` — Jendela waktu 15 menit (dalam milidetik)
- `max: 10` — Maksimal 10 request dalam jendela waktu
- `NODE_ENV === 'test'` — Nonaktifkan saat testing agar test tidak terblokir

### Validasi Email

```js
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

Regex ini memeriksa format email sederhana:
- `[^\s@]+` — Satu atau lebih karakter (bukan spasi/@)
- `@` — Karakter @
- `[^\s@]+` — Domain
- `\.` — Titik
- `[^\s@]+` — TLD (com, org, dll)

### POST /register — Step by Step

**1. Validasi input (client-side validation di backend):**
```js
if (!nama || !nama.trim()) return res.status(400).json({ field: 'nama', message: errors.namaRequired });
if (nama.trim().length < 2) return res.status(400).json({ field: 'nama', message: errors.namaMin });
```

Kita validasi setiap field satu per satu dan mengembalikan error spesifik dengan nama field-nya. Ini memudahkan frontend menampilkan error di input yang tepat.

**2. Cek email duplikat:**
```js
const existing = await User.findOne({ where: { email } });
if (existing) return res.status(409).json({ field: 'email', message: errors.emailExists });
```

`User.findOne({ where: { email } })` — Sequelize akan menjalankan:
```sql
SELECT * FROM users WHERE email = 'user@example.com' LIMIT 1;
```

Jika `existing` tidak `null`, berarti email sudah terdaftar → 409 Conflict.

**3. Buat user:**
```js
const user = await User.create({
  nama: nama.trim(),
  email,
  password,
});
```

`User.create()` — Sequelize menjalankan:
```sql
INSERT INTO users (nama, email, password, createdAt, updatedAt)
VALUES ('User', 'user@example.com', '$2a$10$...', NOW(), NOW());
```

**Perhatikan:** Password yang dikirim adalah PLAIN TEXT (`password`). Tapi karena ada hook `beforeCreate` di model, Sequelize OTOMATIS meng-hash-nya sebelum menyimpan. Route tidak perlu memanggil `bcrypt.hash()`!

**4. Buat token JWT:**
```js
const token = jwt.sign(
  { id: user.id, nama: user.nama, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);
```

- `{ id: user.id, nama: user.nama, email: user.email }` — Payload (data yang akan disimpan di token)
- `JWT_SECRET` — Secret key untuk menandatangani token
- `{ expiresIn: '7d' }` — Token berlaku 7 hari

**5. Response:**
```js
res.status(201).json({
  message: 'Registrasi berhasil.',
  user: { id: user.id, nama: user.nama, email: user.email },
  token,
});
```
201 = Created. Response berisi data user (tanpa password) dan token.

### POST /login — Step by Step

**1. Validasi:**
```js
if (!email || !password) return res.status(400).json({ message: errors.emailPasswordRequired });
```

**2. Cari user berdasarkan email:**
```js
const user = await User.findOne({ where: { email } });
if (!user) return res.status(401).json({ message: errors.emailPasswordWrong });
```

Pesan error sengaja dibuat sama ("Email atau password salah") untuk alasan keamanan — tidak memberi petunjuk mana yang salah (email atau password). Ini mencegah attacker mengetahui apakah suatu email terdaftar.

**3. Verifikasi password:**
```js
const validPassword = await bcrypt.compare(password, user.password);
if (!validPassword) return res.status(401).json({ message: errors.emailPasswordWrong });
```

`bcrypt.compare(plainPassword, hashedPassword)`:
- Mengembalikan `true` jika cocok
- Mengembalikan `false` jika tidak

**4. Buat token:**
Sama seperti register.

### POST /logout

```js
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout berhasil. Silakan hapus token di sisi client.' });
});
```

Karena JWT bersifat **stateless** (server tidak menyimpan session), logout hanya mengembalikan pesan sukses. Client (frontend) bertugas menghapus token dari localStorage.

### GET /me

```js
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

Middleware `authenticateToken` sudah mengekstrak data user dari token dan menyimpannya di `req.user`. Route ini tinggal mengembalikannya.

---

## 10. Routes Tugas (routes/tasks.js)

Routes ini menangani CRUD tugas. Semua route dilindungi oleh middleware `authenticateToken`.

```js
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

**Penjelasan per Bagian:**

### router.use(authenticateToken)

Semua route di file ini otomatis dilindungi — tidak perlu menambahkan middleware `authenticateToken` di setiap route satu per satu.

### Fungsi Pembantu

**isValidDate:**
```js
function isValidDate(dateStr) {
  if (!dateStr) return true;          // null/undefined = valid (opsional)
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}
```
- Format harus `YYYY-MM-DD` (contoh: `2026-07-30`)
- `new Date(dateStr).getTime()` memeriksa apakah tanggalnya valid (misal, `2026-13-01` tidak valid karena bulan 13 tidak ada)

**isBackdate:**
```js
function isBackdate(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}
```
- Membandingkan deadline dengan hari ini
- `today.setHours(0, 0, 0, 0)` — set waktu ke 00:00:00 agar perbandingan hanya berdasarkan tanggal
- Mengembalikan `true` jika deadline sudah lewat

### GET / — Daftar Tugas dengan Filter, Search, Pagination

**Query parameters:**
- `status` — Filter: `pending`, `in-progress`, `done`
- `search` — Cari berdasarkan judul (LIKE)
- `page` — Halaman (default: 1)
- `limit` — Item per halaman (default: 10, min: 1, max: 100)

**Membangun filter:**
```js
const where = { user_id: req.user.id };

if (status && validStatuses.includes(status)) {
  where.status = status;
}

if (search && search.trim()) {
  where.title = { [Op.like]: `%${search.trim()}%` };
}
```

Object `where` dibangun secara dinamis:
- Selalu filter `user_id` (hanya tugas milik user yang login)
- Jika ada `status` valid, tambahkan filter status
- Jika ada `search`, tambahkan `title LIKE %search%`

**Operator `Op.like`:**
```js
const { Op } = require('sequelize');
where.title = { [Op.like]: `%${search.trim()}%` };
```

Ini menghasilkan SQL:
```sql
WHERE title LIKE '%cari%'
```

**Operator Umum Sequelize:**

| Operator | SQL | Contoh Penggunaan |
|----------|-----|-------------------|
| `[Op.eq]` | `=` | `{ [Op.eq]: 5 }` |
| `[Op.ne]` | `!=` | `{ [Op.ne]: 5 }` |
| `[Op.like]` | `LIKE` | `{ [Op.like]: '%text%' }` |
| `[Op.in]` | `IN` | `{ [Op.in]: [1, 2, 3] }` |
| `[Op.between]` | `BETWEEN` | `{ [Op.between]: [10, 20] }` |
| `[Op.gt]` | `>` | `{ [Op.gt]: 10 }` |
| `[Op.gte]` | `>=` | `{ [Op.gte]: 10 }` |
| `[Op.lt]` | `<` | `{ [Op.lt]: 10 }` |
| `[Op.lte]` | `<=` | `{ [Op.lte]: 10 }` |
| `[Op.and]` | `AND` | `{ [Op.and]: [...conditions] }` |
| `[Op.or]` | `OR` | `{ [Op.or]: [...conditions] }` |

**findAndCountAll:**
```js
const { rows, count } = await Task.findAndCountAll({
  where,
  order: [['createdAt', 'DESC']],
  limit,
  offset,
});
```

Ini adalah method Sequelize yang menggabungkan dua query:
1. `SELECT COUNT(*) ...` — untuk menghitung total data
2. `SELECT * ... LIMIT ? OFFSET ?` — untuk mengambil data

Kembaliannya adalah object:
- `rows` — Array data task
- `count` — Integer total data (tanpa pagination)

Ini lebih efisien daripada melakukan dua query terpisah.

**Pagination response:**
```js
res.json({
  tasks: rows,
  pagination: {
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  },
});
```

Frontend menggunakan informasi pagination untuk:
- Menampilkan "Halaman 1 dari 5"
- Mengaktifkan/menonaktifkan tombol Previous/Next
- Menampilkan "Menampilkan 1-10 dari 47"

### GET /:id — Detail Tugas

```js
const task = await Task.findOne({
  where: { id: req.params.id, user_id: req.user.id },
});
```

Mencari task berdasarkan `id` DAN `user_id`. Ini memastikan user hanya bisa mengakses task miliknya sendiri. Jika task tidak ditemukan (bukan miliknya atau tidak ada), return 404.

### POST / — Buat Tugas

**Validasi:**
```js
if (!title || !title.trim()) {
  return res.status(400).json({ field: 'title', message: 'Judul tugas wajib diisi.' });
}
```

**Pengecekan backdate:**
```js
if (isBackdate(deadline)) {
  return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
}
```

Mencegah user membuat tugas dengan deadline yang sudah lewat.

**Create:**
```js
const task = await Task.create({
  title: title.trim(),
  description: description || null,
  status: taskStatus,
  deadline: deadline || null,
  user_id: req.user.id,
});
```

`Task.create()` mengembalikan object task yang sudah lengkap dengan `id` dan timestamps (tidak perlu query SELECT ulang seperti di raw MySQL).

### PUT /:id — Update Tugas

**Cek kepemilikan dulu:**
```js
const task = await Task.findOne({
  where: { id: req.params.id, user_id: req.user.id },
});
if (!task) {
  return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
}
```

**Partial update:**
```js
const newTitle = title !== undefined ? title : task.title;
const newDescription = description !== undefined ? description : task.description;
const newDeadline = deadline !== undefined ? deadline : task.deadline;
```

Jika suatu field tidak dikirim di body request, gunakan nilai lama. Ini memungkinkan frontend mengirim hanya field yang berubah.

**Update:**
```js
await Task.update(
  { title: newTitle.trim(), description: newDescription, status: newStatus, deadline: newDeadline },
  { where: { id: req.params.id, user_id: req.user.id } }
);
```

`Task.update(nilaiBaru, { where })` mengembalikan array `[affectedCount]`.

**Ambil data terbaru:**
```js
const updated = await Task.findByPk(req.params.id);
```

`findByPk(id)` adalah shortcut untuk `findOne({ where: { id } })`. Setelah update, kita ambil data terbaru untuk dikembalikan ke client.

### DELETE /:id — Hapus Tugas

```js
const deleted = await Task.destroy({
  where: { id: req.params.id, user_id: req.user.id },
});
if (deleted === 0) {
  return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
}
```

`Task.destroy()` mengembalikan jumlah baris yang dihapus (integer). Jika 0, berarti task tidak ditemukan atau bukan milik user.

---

## 11. Entry Point Server (server.js)

File ini adalah titik masuk aplikasi. Menginisialisasi semua middleware, route, koneksi database, dan menjalankan server.

```js
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

**Penjelasan per Bagian:**

### Security Headers (Helmet)

```js
app.use(helmet());
app.disable('x-powered-by');
```

`helmet()` memasang berbagai HTTP header keamanan:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (nonaktifkan)
- `Strict-Transport-Security` (HTTPS)
- Dan lain-lain

`app.disable('x-powered-by')` — Menyembunyikan header `X-Powered-By: Express` agar attacker tidak tahu kita pakai Express.

### CORS

```js
const corsOrigin = isProduction
  ? (process.env.CORS_ORIGIN || 'https://todo.adityanuriskandar.com').split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: corsOrigin, credentials: true }));
```

CORS (Cross-Origin Resource Sharing) mengizinkan frontend di domain berbeda mengakses API.

- **Development:** Mengizinkan `localhost:5173` (Vite) dan `localhost:3000`
- **Production:** Membaca dari environment variable `CORS_ORIGIN`, bisa multiple origin (dipisah koma)

`credentials: true` — Mengizinkan pengiriman cookie/header Authorization.

### Body Parser

```js
app.use(express.json({ limit: '10kb' }));
```

Mengubah body request JSON menjadi object JavaScript. Limit 10KB mencegah request dengan body terlalu besar (serangan DDoS).

### Morgan Logger

```js
app.use(morgan(isProduction ? 'combined' : 'dev'));
```

Morgan mencatat setiap HTTP request:
- **`dev`** — Format ringkas untuk development:
  ```
  POST /api/auth/register 201 12.345 ms
  ```
- **`combined`** — Format lengkap untuk production (Apache-style):
  ```
  127.0.0.1 - - [30/Jul/2026:10:00:00 +0000] "POST /api/auth/register HTTP/1.1" 201 123 "-" "Mozilla/5.0"
  ```

### Rate Limit Global

```js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});
app.use('/api/', apiLimiter);
```

Rate limit GLOBAL untuk semua endpoint `/api/`:
- 100 request per 15 menit
- Jika melebihi, return 429 Too Many Requests

Ini berbeda dengan rate limit di routes/auth.js yang khusus untuk endpoint auth (10 request/15 menit).

### Fungsi init()

```js
async function init() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    await sequelize.sync({ alter: false });
    console.log('Model tersinkronisasi. Tabel siap.');
  } catch (err) {
    console.error('Gagal koneksi database:', err.message);
    process.exit(1);
  }
}
```

**sequelize.authenticate():**
Mengecek koneksi ke database dengan menjalankan `SELECT 1+1 AS result`. Jika gagal (database tidak bisa diakses), server akan berhenti (`process.exit(1)`).

**sequelize.sync({ alter: false }):**
Menyinkronkan model dengan database — membuat tabel jika belum ada.

| Opsi | Efek | Kapan dipakai |
|------|------|---------------|
| `sync()` | Buat tabel jika belum ada | Production (aman) |
| `sync({ alter: true })` | Ubah tabel sesuai model | Development (hati-hati) |
| `sync({ force: true })` | DROP + buat ulang | Development only (data hilang!) |

### require.main === module

```js
if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  });
}
```

Ini memeriksa apakah file dijalankan langsung (`node server.js`) atau di-import oleh file lain (seperti test).

- Jika dijalankan langsung → jalankan server
- Jika di-import test → jangan jalankan server (test menggunakan `supertest` yang bisa memanggil Express tanpa server)

### module.exports

```js
module.exports = { app, init };
```

Export untuk keperluan testing. Test akan meng-import `{ app, init }` dan menggunakan `supertest(app)` tanpa perlu menjalankan server.

### Tabel yang Dibuat Otomatis

Saat `sequelize.sync()` dijalankan, Sequelize membuat tabel berikut:

```sql
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

> **Catatan:** Kolom timestamp bernama `createdAt` dan `updatedAt` (camelCase), bukan `created_at`/`updated_at`. Jika ingin menggunakan snake_case, tambahkan `underscored: true` di definisi model.

---

## 12. Testing dengan Jest (__tests__/auth.test.js)

Testing memastikan API berfungsi sesuai harapan. Kita menggunakan Jest (test runner) dan Supertest (HTTP assertion).

```js
const request = require('supertest');
const { app, init } = require('../server');
const { User } = require('../models');
const { Op } = require('sequelize');

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await User.destroy({
    where: { email: { [Op.like]: 'test-%@test.com' } },
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

**Penjelasan:**

### Setup

```js
const request = require('supertest');
const { app, init } = require('../server');
const { User } = require('../models');
const { Op } = require('sequelize');
```

- `supertest` — Library untuk simulasi HTTP request ke Express app
- `{ app, init }` — Kita import dari server.js (app tanpa perlu menjalankan server)
- `{ User }` — Model untuk operasi database (cleanup data test)
- `{ Op }` — Operator Sequelize untuk LIKE query

### beforeAll

```js
beforeAll(async () => {
  await init();
});
```

Dijalankan SATU KALI sebelum semua test. Memanggil `init()` untuk:
1. `sequelize.authenticate()` — cek koneksi database
2. `sequelize.sync()` — buat tabel jika belum ada

### afterAll

```js
afterAll(async () => {
  await User.destroy({
    where: { email: { [Op.like]: 'test-%@test.com' } },
  });
});
```

Dijalankan SATU KALI setelah semua test selesai. Membersihkan data test:
- `User.destroy({ where: ... })` — menghapus semua user dengan email pattern `test-*@test.com`
- Ini menjaga database tetap bersih

### Test Cases

**1. Register sukses (201):**
Mengirim data valid, mengharapkan response 201 dengan token dan data user.

**2. Duplikat email (409):**
Mengirim email yang sama dengan test sebelumnya, mengharapkan 409 Conflict.

**3. Nama kosong (400):**
Mengirim `nama: ''`, mengharapkan 400 dengan `field: 'nama'`.

**4. Nama terlalu pendek (400):**
Mengirim `nama: 'A'` (1 karakter), mengharapkan 400.

**5. Email tidak valid (400):**
Mengirim `email: 'not-an-email'`, mengharapkan 400 dengan `field: 'email'`.

**6. Password terlalu pendek (400):**
Mengirim `password: '12345'` (5 karakter), mengharapkan 400.

**7. Field kosong (400):**
Mengirim body kosong `{}`, mengharapkan 400 (field pertama yang divalidasi).

### Menjalankan Test

```bash
cd backend-api
NODE_ENV=test npm test
```

`NODE_ENV=test` — Memberi tahu aplikasi bahwa ini mode test (menonaktifkan rate limiter).

Output yang diharapkan:
```
 PASS  __tests__/auth.test.js
  POST /api/auth/register
    ✓ should register a new user successfully (XX ms)
    ✓ should reject duplicate email (XX ms)
    ✓ should reject empty nama (XX ms)
    ✓ should reject nama < 2 characters (XX ms)
    ✓ should reject invalid email format (XX ms)
    ✓ should reject password < 6 characters (XX ms)
    ✓ should reject missing fields (XX ms)

Tests: 7 passed, 7 total
```

---

## 13. Dockerfile Backend

Dockerfile digunakan untuk membangun image Docker dari aplikasi backend.

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

**Penjelasan per Baris:**

| Baris | Fungsi |
|-------|--------|
| `FROM node:20-alpine` | Base image: Node.js versi 20, Alpine Linux (ukuran kecil ~120MB) |
| `WORKDIR /app` | Set direktori kerja di dalam container |
| `COPY package.json package-lock.json* ./` | Copy file dependencies dulu (memanfaatkan Docker cache) |
| `RUN npm ci --omit=dev` | Instal hanya production dependencies (lebih cepat dari `npm install`) |
| `COPY . .` | Copy semua file aplikasi |
| `EXPOSE 3000` | Memberi tahu Docker bahwa container akan menggunakan port 3000 |
| `CMD ["node", "server.js"]` | Perintah untuk menjalankan aplikasi |

### Kenapa COPY package.json dipisah?

Docker membangun image dalam layer. Dengan memisahkan `COPY package.json` dan `RUN npm ci`, Docker bisa me-cache layer instalasi dependencies. Jika hanya kode aplikasi yang berubah (bukan package.json), Docker menggunakan cache untuk instalasi dependencies — lebih cepat.

---

## 14. .dockerignore

File ini memberitahu Docker file/folder apa yang TIDAK boleh masuk ke image.

```
node_modules
npm-debug.log
__tests__
.env
```

**Penjelasan:**

| Entry | Alasan |
|-------|--------|
| `node_modules` | Akan diinstal ulang saat build (oleh `npm ci`) |
| `npm-debug.log` | File log debug, tidak perlu di image |
| `__tests__` | Testing tidak diperlukan di production |
| `.env` | Berisi rahasia (password, key), jangan masuk image |

---

## 15. Menjalankan Aplikasi

### Prasyarat

1. MySQL sudah terinstall dan berjalan
2. Database `kanggo_db` sudah dibuat:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kanggo_db;"
   ```
3. File `.env` sudah diisi (minimal `JWT_SECRET`)

### Development

```bash
cd backend-api
npm run dev
```

Menggunakan `node --watch` (built-in di Node.js 18+) — server otomatis restart jika ada perubahan file.

### Production

```bash
cd backend-api
NODE_ENV=production npm start
```

### Testing

```bash
cd backend-api
NODE_ENV=test npm test
```

### Verifikasi

Buka browser atau gunakan curl:

```bash
# Cek status
curl http://localhost:3000/
# Response: { "message": "Backend Kanggo API siap!" }

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test","email":"test@example.com","password":"123456"}'
# Response: { "message": "Registrasi berhasil.", "user": {...}, "token": "..." }
```

---

## Ringkasan Perubahan: Raw MySQL → Sequelize

| File | Tanpa Sequelize (Raw SQL) | Dengan Sequelize |
|------|--------------------------|------------------|
| **package.json** | `mysql2` sebagai driver utama | `sequelize` + `mysql2` (sebagai driver) |
| **config/db.js** | `mysql.createPool()` | `new Sequelize()` |
| **models/User.js** | ❌ Tidak ada | `sequelize.define('User', ...)` + hook bcrypt |
| **models/Task.js** | ❌ Tidak ada | `sequelize.define('Task', ...)` |
| **models/index.js** | ❌ Tidak ada | `User.hasMany(Task)`, `Task.belongsTo(User)` |
| **routes/auth.js** | `pool.query('INSERT ...')` + `bcrypt.hash()` | `User.create()` (hash otomatis di hook) |
| **routes/auth.js** | `pool.query('SELECT ... WHERE email = ?')` | `User.findOne({ where: { email } })` |
| **routes/tasks.js** | `pool.query(...)` semua operasi | `Task.findAll`, `findOne`, `create`, `update`, `destroy` |
| **routes/tasks.js** | 2 query terpisah (COUNT + SELECT) | `findAndCountAll()` — satu method |
| **server.js** | `CREATE TABLE IF NOT EXISTS` manual | `sequelize.sync()` otomatis |
| **server.js** | `pool.getConnection()` cek koneksi | `sequelize.authenticate()` |
| **__tests__** | `pool.query('DELETE ... WHERE email LIKE ...')` | `User.destroy({ where: { email: { [Op.like]: ... } } })` |

---

## Kesimpulan

Kamu sekarang telah membangun backend Kanggo Todo App menggunakan **Sequelize ORM**! Beberapa hal penting yang dipelajari:

1. **Model** — Representasi tabel database dalam JavaScript dengan tipe data dan validasi
2. **Hook** — Otomatisasi logic (hash password) sebelum data disimpan
3. **Asosiasi** — Relasi antar tabel dengan `hasMany` / `belongsTo`
4. **Method Sequelize** — `create`, `findOne`, `findAll`, `findAndCountAll`, `update`, `destroy`
5. **Operator** — `Op.like`, `Op.eq`, dll untuk query yang lebih kompleks
6. **Sync** — Sinkronisasi model ke database secara otomatis

Selanjutnya, kamu bisa melanjutkan dengan tutorial frontend untuk membuat UI yang berinteraksi dengan API ini.
