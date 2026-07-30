# Tutorial Backend Kanggo Todo App — Sequelize ORM

Backend API dengan **Express.js + Sequelize ORM + MySQL**. Langsung to the point.

---

## 📦 1. Install Packages

```bash
mkdir kanggo-todo-app
cd kanggo-todo-app
mkdir backend-api
cd backend-api
npm init -y
```

```bash
# Framework
npm install express

# Middleware
npm install cors
npm install helmet
npm install morgan

# Database
npm install sequelize mysql2

# Auth
npm install bcryptjs jsonwebtoken

# Utility
npm install dotenv express-rate-limit

# Testing
npm install --save-dev jest supertest
```

Edit `package.json` → ganti `"scripts"` jadi:

```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "test": "node --experimental-vm-modules node_modules/.bin/jest --detectOpenHandles"
}
```

---

## 📁 2. Buat Folder & File

```bash
mkdir config models middleware routes __tests__
touch .env .env.example Dockerfile .dockerignore
touch server.js
touch config/db.js
touch models/User.js models/Task.js models/index.js
touch middleware/auth.js
touch routes/auth.js routes/tasks.js
touch __tests__/auth.test.js
```

---

## 📄 3. .env

```bash
touch .env .env.example
```

Isi `.env` dan `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=bosani
DB_PASSWORD=1234567890
DB_DATABASE=kanggo_db

JWT_SECRET=kanggo-secret-key-2026
API_PORT=3000

NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 📄 4. config/db.js

Koneksi Sequelize ke MySQL.

```js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'kanggo_db',
  process.env.DB_USER || 'bosani',
  process.env.DB_PASSWORD || '1234567890',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: { freezeTableName: true },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

module.exports = sequelize;
```

---

## 📄 5. models/User.js

```js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nama: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
}, { timestamps: true });

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

module.exports = User;
```

---

## 📄 6. models/Task.js

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('tasks', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'done'),
    defaultValue: 'pending',
  },
  deadline: { type: DataTypes.DATEONLY },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true });

module.exports = Task;
```

---

## 📄 7. models/index.js

Relasi: User punya banyak Task, Task milik satu User.

```js
const User = require('./User');
const Task = require('./Task');

User.hasMany(Task, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Task };
```

---

## 📄 8. middleware/auth.js

Verifikasi JWT.

```js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kanggo-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
```

---

## 📄 9. routes/auth.js

Register, Login, Logout, Me. Rate limited (10x/15 menit).

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
  message: { message: 'Terlalu banyak percobaan login/register. Coba lagi dalam 15 menit.' },
});

const mw = authLimiter || ((req, res, next) => next());

// Helper validasi
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// Register
router.post('/register', mw, async (req, res) => {
  try {
    const { nama, email, password } = req.body;
    if (!nama || !nama.trim()) return res.status(400).json({ field: 'nama', message: 'Nama wajib diisi.' });
    if (nama.trim().length < 2) return res.status(400).json({ field: 'nama', message: 'Nama minimal 2 karakter.' });
    if (!email) return res.status(400).json({ field: 'email', message: 'Email wajib diisi.' });
    if (!validateEmail(email)) return res.status(400).json({ field: 'email', message: 'Format email tidak valid.' });
    if (!password) return res.status(400).json({ field: 'password', message: 'Password wajib diisi.' });
    if (password.length < 6) return res.status(400).json({ field: 'password', message: 'Password minimal 6 karakter.' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ field: 'email', message: 'Email sudah terdaftar.' });
    const user = await User.create({ nama: nama.trim(), email, password });
    const token = jwt.sign({ id: user.id, nama: user.nama, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registrasi berhasil.', user: { id: user.id, nama: user.nama, email: user.email }, token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// Login
router.post('/login', mw, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    if (!validateEmail(email)) return res.status(400).json({ field: 'email', message: 'Format email tidak valid.' });
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const token = jwt.sign({ id: user.id, nama: user.nama, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login berhasil.', user: { id: user.id, nama: user.nama, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout berhasil.' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
```

---

## 📄 10. routes/tasks.js

CRUD tugas dengan filter, search, pagination, validasi backdate.

```js
const express = require('express');
const { Op } = require('sequelize');
const { Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

function isValidDate(d) { return !d || (/^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime())); }
function isBackdate(d) {
  if (!d) return false;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return new Date(d) < t;
}

// GET / — daftar tugas (filter, search, pagination)
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const where = { user_id: req.user.id };
    const validStatuses = ['pending', 'in-progress', 'done'];
    if (status && validStatuses.includes(status)) where.status = status;
    if (search && search.trim()) where.title = { [Op.like]: `%${search.trim()}%` };
    const { rows, count } = await Task.findAndCountAll({
      where, order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit,
    });
    res.json({ tasks: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Gagal mengambil daftar tugas.' });
  }
});

// GET /:id — detail tugas
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    res.json({ task });
  } catch (err) {
    console.error('Get task error:', err.message);
    res.status(500).json({ message: 'Gagal mengambil tugas.' });
  }
});

// POST / — buat tugas
router.post('/', async (req, res) => {
  try {
    const { title, description, status, deadline } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ field: 'title', message: 'Judul tugas wajib diisi.' });
    if (title.trim().length > 255) return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    if (deadline && !isValidDate(deadline)) return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid.' });
    if (isBackdate(deadline)) return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    const validStatuses = ['pending', 'in-progress', 'done'];
    const taskStatus = status && validStatuses.includes(status) ? status : 'pending';
    const task = await Task.create({ title: title.trim(), description: description || null, status: taskStatus, deadline: deadline || null, user_id: req.user.id });
    res.status(201).json({ message: 'Tugas berhasil dibuat.', task });
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ message: 'Gagal membuat tugas.' });
  }
});

// PUT /:id — update tugas
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    const { title, description, status, deadline } = req.body;
    const newTitle = title !== undefined ? title : task.title;
    const newDesc = description !== undefined ? description : task.description;
    const newDeadline = deadline !== undefined ? deadline : task.deadline;
    if (!newTitle || !newTitle.trim()) return res.status(400).json({ field: 'title', message: 'Judul tugas tidak boleh kosong.' });
    if (newTitle.trim().length > 255) return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    if (deadline !== undefined && deadline !== null && deadline !== '' && !isValidDate(deadline))
      return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid.' });
    if (deadline !== undefined && deadline !== null && deadline !== '' && isBackdate(deadline))
      return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    const validStatuses = ['pending', 'in-progress', 'done'];
    const newStatus = status && validStatuses.includes(status) ? status : task.status;
    await Task.update({ title: newTitle.trim(), description: newDesc, status: newStatus, deadline: newDeadline }, { where: { id: req.params.id } });
    const updated = await Task.findByPk(req.params.id);
    res.json({ message: 'Tugas berhasil diperbarui.', task: updated });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: 'Gagal memperbarui tugas.' });
  }
});

// DELETE /:id — hapus tugas
router.delete('/:id', async (req, res) => {
  try {
    const result = await Task.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    if (result === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    res.json({ message: 'Tugas berhasil dihapus.' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Gagal menghapus tugas.' });
  }
});

module.exports = router;
```

---

## 📄 11. server.js

Entry point. Load semua middleware, routes, sync database.

```js
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db');
require('./models');
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
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '10kb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { message: 'Terlalu banyak permintaan.' },
}));

app.get('/', (req, res) => res.json({ message: 'Backend Kanggo API siap!' }));
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Kamu sudah login.', user: req.user });
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
    await sequelize.sync();
    console.log('Database siap.');
  } catch (err) {
    console.error('Gagal koneksi database:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  });
}

module.exports = { app, init };
```

---

## 📄 12. __tests__/auth.test.js

7 test untuk register dengan Jest + Supertest.

```js
const request = require('supertest');
const { app, init } = require('../server');
const { User } = require('../models');

beforeAll(async () => { await init(); });
afterAll(async () => {
  await User.destroy({ where: { email: ['test-%@test.com'] }, force: true });
});

describe('POST /api/auth/register', () => {
  const validUser = { nama: 'Test User', email: `test-${Date.now()}@test.com`, password: '123456' };

  it('should register successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registrasi berhasil.');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body).toHaveProperty('token');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('should reject empty nama', async () => {
    const res = await request(app).post('/api/auth/register').send({ nama: '', email: 't@t.com', password: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('nama');
  });

  it('should reject nama < 2 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({ nama: 'A', email: 't@t.com', password: '123456' });
    expect(res.status).toBe(400);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ nama: 'Test', email: 'bademail', password: '123456' });
    expect(res.status).toBe(400);
  });

  it('should reject short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ nama: 'Test', email: 't@t.com', password: '12345' });
    expect(res.status).toBe(400);
  });

  it('should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });
});
```

---

## 📄 13. Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### .dockerignore

```
node_modules
npm-debug.log
__tests__
.env
```

---

## 🚀 14. Menjalankan

```bash
# Pastikan MySQL sudah running dan database kanggo_db sudah dibuat
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kanggo_db;"

# Jalankan
cd backend-api
npm start
# atau
npm run dev
```

### Testing

```bash
cd backend-api
npm test
```

### Docker

```bash
cd backend-api
docker build -t kanggo-backend .
docker run -p 3000:3000 --env-file .env kanggo-backend
```

---

API akan berjalan di `http://localhost:3000`.
