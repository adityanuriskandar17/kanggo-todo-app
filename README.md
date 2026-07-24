# Kanggo - FullStack Todo App

Aplikasi manajemen tugas berbasis web dengan autentikasi JWT. Dibangun menggunakan **Express.js** (backend) dan **React + Vite + Tailwind CSS** (frontend) dengan database **MySQL**.

## Fitur

- Registrasi & Login pengguna (JWT)
- CRUD tugas (Create, Read, Update, Delete)
- Filter tugas berdasarkan status (pending, in-progress, done)
- Pencarian tugas berdasarkan judul (live search)
- Pagination
- Validasi input (client & server)
- Proteksi route (hanya user login yang bisa akses)

## Struktur Project

```
kanggo/
├── backend-api/          # REST API (Express.js)
│   ├── config/db.js      # Koneksi MySQL
│   ├── middleware/auth.js # JWT middleware
│   ├── routes/auth.js    # Auth endpoints
│   ├── routes/tasks.js   # Tasks endpoints
│   ├── __tests__/        # Unit test
│   └── server.js         # Entry point
├── frontend/             # React App (Vite + Tailwind)
│   └── src/
│       ├── api/          # Axios config
│       ├── components/   # Navbar, ProtectedRoute, ConfirmModal
│       └── pages/        # Login, Register, Dashboard, TaskForm
├── postman/              # Postman collection & environment
├── schema.sql            # Struktur database
├── docker-compose.yml    # Docker setup
└── .env.example          # Contoh environment variables
```

---

## Backend

### Prerequisites

- Node.js 18+
- MySQL 8.0
- npm

### Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE kanggo_db;
EXIT

# Import schema
mysql -u root -p kanggo_db < schema.sql
```

Atau biarkan backend membuat tabel otomatis saat pertama kali jalan (tabel akan dibuat jika belum ada).

### Environment Variables

Salin `.env.example` lalu isi konfigurasi:

```bash
cp .env.example .env
```

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `DB_HOST` | `localhost` | Host MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USER` | - | User MySQL |
| `DB_PASSWORD` | - | Password MySQL |
| `DB_DATABASE` | `kanggo_db` | Nama database |
| `JWT_SECRET` | - | Secret key untuk JWT |
| `API_PORT` | `3000` | Port backend |

### Install & Run

```bash
cd backend-api
npm install
npm start
```

Server berjalan di `http://localhost:3000`.

### Menjalankan Test

```bash
cd backend-api
npm test
```

### API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | - | Registrasi user |
| POST | `/api/auth/login` | - | Login → JWT |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/auth/me` | ✓ | Profile user |
| GET | `/api/tasks` | ✓ | Daftar tugas (query: `?status=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/tasks/:id` | ✓ | Detail tugas |
| POST | `/api/tasks` | ✓ | Buat tugas |
| PUT | `/api/tasks/:id` | ✓ | Update tugas |
| DELETE | `/api/tasks/:id` | ✓ | Hapus tugas |

---

## Frontend

### Install & Run

```bash
cd frontend
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

### Build untuk Production

```bash
cd frontend
npm run build
```

### Menjalankan Test

```bash
cd frontend
npm test
```

---

## Docker

Jalankan seluruh stack (MySQL + Backend + Frontend) dengan satu perintah:

```bash
docker compose up -d
```

| Service | Port |
|---------|------|
| MySQL | `3307` |
| Backend | `3000` |
| Frontend | `5173` |

---

## Postman

Import file dari folder `postman/` ke Postman:

- `kanggo-api.postman_collection.json`
- `kanggo-api.postman_environment.json`

Pilih environment **Kanggo API (Local)**, jalankan **Register** atau **Login** (token otomatis tersimpan), lalu endpoint Tasks siap digunakan.
