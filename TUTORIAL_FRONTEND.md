# Tutorial Frontend Kanggo Todo App

Tutorial ini akan memandu kamu membangun **frontend** Kanggo Todo App — aplikasi manajemen tugas berbasis web dengan autentikasi JWT. Stack yang digunakan: **React 19 + Vite + Tailwind CSS v4 + React Router v7 + Axios + Lucide React**, dengan **Vitest** untuk testing.

> **Catatan:** Tutorial ini hanya mencakup **frontend**. Backend (Express.js + MySQL) dibahas di tutorial terpisah.

---

## Daftar Isi

1. [Frontend Setup](#1-frontend-setup)
2. [vite.config.js — Konfigurasi Vite](#2-viteconfigjs--konfigurasi-vite)
3. [index.html — Entry HTML](#3-indexhtml--entry-html)
4. [src/index.css — Tailwind CSS](#4-srcindexcss--tailwind-css)
5. [src/main.jsx — Entry React](#5-srcmainjsx--entry-react)
6. [src/test/setup.js — Setup Testing](#6-srctestsetupjs--setup-testing)
7. [src/api/axios.js — Axios Instance & Interceptor](#7-srcapiaxiosjs--axios-instance--interceptor)
8. [Components](#8-components)
   - [Navbar](#81-navbar)
   - [ProtectedRoute](#82-protectedroute)
   - [ConfirmModal](#83-confirmmodal)
9. [Pages](#9-pages)
   - [Login](#91-login)
   - [Register](#92-register)
   - [Dashboard](#93-dashboard)
   - [TaskForm](#94-taskform)
10. [App.jsx — Routing](#10-appjsx--routing)
11. [Testing](#11-testing)
    - [Setup file](#111-setup-file)
    - [Navbar.test.jsx](#112-navbartestjsx)
12. [Cara Menjalankan](#12-cara-menjalankan)

---

## 1. Frontend Setup

### 1.1 Inisialisasi Project

Buka terminal di folder project utama (`FullStack_Kanggo`), lalu jalankan:

```bash
npm create vite@latest frontend -- --template react
```

Perintah ini membuat folder `frontend/` dengan boilerplate React + Vite. Opsi `--template react` memastikan project menggunakan React (bukan Vue atau Svelte).

Masuk ke folder frontend dan instal dependencies bawaan:

```bash
cd frontend
npm install
```

### 1.2 Instal Dependencies Tambahan

```bash
npm install react-router-dom axios lucide-react
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Penjelasan setiap package:**

**Dependencies (production):**
| Package | Kegunaan |
|---------|----------|
| `react-router-dom` | Routing — navigasi antar halaman tanpa reload |
| `axios` | HTTP client — memanggil API backend |
| `lucide-react` | Icon library — ikon-ikon UI |

**DevDependencies (hanya untuk development):**
| Package | Kegunaan |
|---------|----------|
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/vite` | Plugin Tailwind untuk Vite (Tailwind v4 pakai Vite plugin, bukan PostCSS) |
| `vitest` | Testing framework (cepat, kompatibel dengan Vite) |
| `@testing-library/react` | Render komponen React di test |
| `@testing-library/jest-dom` | Matchers custom untuk DOM (`.toBeInTheDocument()`, dll) |
| `jsdom` | Simulasi browser di Node.js untuk testing |

### 1.3 package.json

Berikut isi `package.json` setelah semua dependencies terinstal:

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

**Penjelasan scripts:**
- `dev` — Menjalankan Vite dev server (default di `http://localhost:5173`)
- `build` — Build production ke folder `dist/`
- `lint` — Menjalankan oxlint (linter cepat pengganti ESLint)
- `preview` — Preview hasil build secara lokal
- `test` — Menjalankan test dengan Vitest

---

## 2. vite.config.js — Konfigurasi Vite

Buat file `vite.config.js` di root folder `frontend/`:

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

**`plugins: [react(), tailwindcss()]`:**
- `@vitejs/plugin-react` — Plugin resmi untuk React. Menangani JSX transform, React Refresh (hot reload), dll.
- `@tailwindcss/vite` — Plugin Tailwind CSS versi 4. Di versi 4, Tailwind menggunakan Vite plugin langsung, bukan file `postcss.config.js` dan `tailwind.config.js` seperti versi 3.

**`server.proxy`:**
```javascript
proxy: { '/api': 'http://localhost:3000' }
```
Saat development, semua request ke `/api/*` (misal `fetch('/api/auth/login')`) akan diteruskan ke `http://localhost:3000` (backend). Ini menghindari masalah CORS di development — browser menganggap request tetap ke domain yang sama.

**`test`:**
```javascript
test: {
  environment: 'jsdom',    // Simulasi browser di Node.js
  globals: true,           // Fungsi global seperti describe, it, vi tersedia tanpa import
  setupFiles: ['./src/test/setup.js'],  // Setup yang dijalankan sebelum test
}
```
Konfigurasi untuk Vitest. `environment: 'jsdom'` menyediakan DOM API palsu (tanpa browser sungguhan). `globals: true` memungkinkan kita pakai `describe`, `it`, `expect`, `vi.fn()` tanpa perlu import.

---

## 3. index.html — Entry HTML

Buka `index.html` di root folder `frontend/` dan isi dengan:

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

**Penjelasan per bagian:**

**`<html lang="id">`** — Menandai bahwa halaman berbahasa Indonesia. Penting untuk SEO dan aksesibilitas.

**Meta tags:**
- `charset="UTF-8"` — Encoding karakter (wajib untuk dukungan aksara Indonesia)
- `viewport` — Responsive design di mobile
- `description` — Deskripsi singkat yang muncul di hasil pencarian Google
- `robots` — `index, follow` artinya Google boleh mengindeks halaman ini

**Open Graph (OG) tags:**
Digunakan oleh Facebook, LinkedIn, WhatsApp, dll. saat link dibagikan:
- `og:title` — Judul yang muncul saat link dibagikan
- `og:description` — Deskripsi saat link dibagikan
- `og:type` — Tipe konten (`website`)
- `og:url` — URL kanonikal

**Twitter Card:**
- `twitter:card` — Tipe card (`summary` = judul + deskripsi + gambar)

**`link rel="canonical"`** — URL kanonikal. Memberi tahu Google bahwa URL ini adalah versi utama, mencegah masalah konten duplikat.

**JSON-LD (Schema.org):**
```json
<script type="application/ld+json">
```
Data terstruktur untuk mesin pencari. Mendefinisikan bahwa aplikasi ini adalah `WebApplication` dengan kategori `Task Management`. Membantu Google menampilkan rich snippets di hasil pencarian.

**`<div id="root">`** — Elemen tempat React akan me-render aplikasi.

**`<script type="module" src="/src/main.jsx">`** — Entry point aplikasi. Vite akan memproses file ini dan semua impornya.

---

## 4. src/index.css — Tailwind CSS

```css
@import "tailwindcss";
```

Satu baris ini sudah cukup untuk Tailwind CSS versi 4. Semua utility classes (seperti `flex`, `text-center`, `bg-blue-600`, `p-4`, dll.) langsung tersedia. Tidak perlu `tailwind.config.js` atau `postcss.config.js`.

---

## 5. src/main.jsx — Entry React

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

**Penjelasan:**

- **`createRoot`** — API React 19 (sebelumnya `ReactDOM.render` di React 17). Membuat root React di elemen `<div id="root">`.
- **`StrictMode`** — Mode ketat React. Di development, komponen di-render dua kali untuk mendeteksi side effect yang tidak aman. Tidak berpengaruh di production.
- **`import './index.css'`** — Mengimpor CSS global (Tailwind). Semua style Tailwind tersedia di seluruh komponen.
- **`<App />`** — Komponen utama aplikasi (akan dibuat nanti).

---

## 6. src/test/setup.js — Setup Testing

```javascript
import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Penjelasan:**

**`import '@testing-library/jest-dom'`:**
Import ini menambahkan matchers custom ke `expect`, seperti:
- `toBeInTheDocument()` — apakah elemen ada di DOM
- `toHaveTextContent()` — apakah elemen memiliki teks tertentu
- `toHaveClass()` — apakah elemen memiliki class CSS
- Dan lain-lain

**`matchMedia` mock:**
`window.matchMedia` digunakan oleh Tailwind CSS dan komponen untuk mendeteksi ukuran layar. Di lingkungan jsdom (testing), fungsi ini tidak tersedia secara default. Mock ini menyediakan implementasi palsu agar komponen yang bergantung pada matchMedia (seperti responsive design) tidak error saat di-test.

- `matches: false` — Defaultnya dianggap layar kecil (mobile)
- Semua method (`addListener`, `removeListener`, dll.) di-mock dengan `vi.fn()` agar bisa dipanggil tanpa error

---

## 7. src/api/axios.js — Axios Instance & Interceptor

Buat folder `src/api/` dan file `axios.js`:

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

**`axios.create({ baseURL: '/api' })`:**
Membuat instance Axios baru dengan konfigurasi dasar. Semua request akan otomatis diawali dengan `/api`. Contoh: `api.get('/tasks')` akan memanggil `/api/tasks`. Saat development, Vite proxy akan meneruskannya ke `http://localhost:3000/api/tasks`.

**Request interceptor:**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
Interceptor ini berjalan **sebelum** setiap request dikirim. Cara kerja:
1. Ambil token JWT dari `localStorage`
2. Jika token ada, tambahkan header `Authorization: Bearer <token>`
3. Header ini akan digunakan backend untuk memverifikasi identitas user

**Response interceptor:**
```javascript
api.interceptors.response.use(
  (res) => res,   // Jika sukses, lewati saja
  (err) => { ... }  // Jika error
);
```
Interceptor ini berjalan **setelah** response diterima. Jika response error:
1. Cek apakah statusnya `401 (Unauthorized)` atau `403 (Forbidden)`
2. Cek apakah user masih punya token (berarti token expired atau invalid)
3. Jika ya: hapus token dan data user dari localStorage, redirect ke `/login`
4. Jika tidak: biarkan error diproses oleh komponen yang memanggil API

**Mengapa redirect di interceptor?**
Kita tidak perlu menulis logika redirect 401 di setiap komponen yang memanggil API. Cukup di satu tempat ini.

**`return Promise.reject(err)`:**
Error tetap diteruskan ke pemanggil (`catch` block di komponen). Interceptor tidak "menelan" error, hanya menambahkan behavior tambahan.

---

## 8. Components

### 8.1 Navbar

**Konsep:**
Navbar adalah komponen navigasi yang muncul di semua halaman. Fungsinya:
- Menampilkan logo/nama aplikasi (klik → ke halaman utama)
- Jika user login: menampilkan sapaan "Halo, {nama}" dan tombol Logout
- Jika user tidak login: hanya menampilkan logo
- Responsif: teks disembunyikan di layar kecil (mobile)

Buat file `src/components/Navbar.jsx`:

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

**Penjelasan per bagian:**

**Props:**
- `user` — Object user `{ id, nama, email }` atau `null` jika belum login
- `onLogout` — Callback function yang dipanggil saat logout (untuk update state di App)

**`useNavigate()`:**
Hook React Router untuk navigasi programatis. `navigate('/')` pindah ke halaman utama, `navigate('/login')` pindah ke halaman login.

**`handleLogout`:**
1. Hapus token dan user dari `localStorage`
2. Panggil `onLogout()` — memberitahu komponen App bahwa user sudah logout (state `user` jadi `null`)
3. Redirect ke halaman login

**Struktur JSX:**
- `<nav>` — Elemen navigasi dengan background putih, shadow tipis, border bawah
- Logo (ikon `ClipboardList` + teks "Kanggo Todo App") — klik → `navigate('/')`
- Bagian kanan: hanya tampil jika `user` ada (truthy)
  - `hidden sm:inline` — Teks disembunyikan di layar `sm` (mobile), muncul di layar lebih besar
  - Tombol Logout — hanya ikon yang terlihat di mobile, teks "Logout" muncul di desktop via `hidden sm:inline`

**CSS `shrink-0`:**
Mencegah ikon mengecil saat konten di sampingnya panjang.

### 8.2 ProtectedRoute

**Konsep:**
ProtectedRoute adalah komponen yang membungkus halaman yang hanya bisa diakses oleh user yang sudah login. Jika user belum login (tidak punya token), dia akan diarahkan ke halaman login. Ini disebut **route protection**.

Buat file `src/components/ProtectedRoute.jsx`:

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

**`localStorage.getItem('token')`:**
Token JWT disimpan di localStorage saat login/register. Jika token ada, berarti user sudah login.

**`<Navigate to="/login" replace />`:**
- `Navigate` adalah komponen React Router yang langsung redirect (tanpa perlu `useNavigate`)
- `replace` — mengganti entry di history browser. Artinya user tidak bisa klik tombol "Back" untuk kembali ke halaman yang dilindungi setelah di-redirect.

**`children`:**
ProtectedRoute menggunakan pola **wrapper**. Komponen ini membungkus halaman yang dilindungi:
```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```
Jika user terautentikasi, `<Dashboard />` akan di-render. Jika tidak, user di-redirect.

### 8.3 ConfirmModal

**Konsep:**
Modal konfirmasi digunakan untuk meminta konfirmasi user sebelum melakukan aksi destruktif (seperti menghapus tugas). Komponen ini render di atas halaman (overlay) dengan backdrop blur, dan memiliki dua tombol: Batal dan Hapus.

Buat file `src/components/ConfirmModal.jsx`:

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

**Penjelasan per bagian:**

**Props:**
- `open` — Boolean. Jika `false`, modal tidak dirender (`return null`)
- `title` — Judul modal (misal "Hapus Tugas")
- `message` — Pesan konfirmasi (misal "Apakah kamu yakin ingin menghapus tugas '...'?")
- `onConfirm` — Callback saat user klik "Hapus"
- `onCancel` — Callback saat user klik "Batal" atau klik di luar modal

**`fixed inset-0 z-50`:**
- `fixed` — Posisi tetap, mengikuti viewport
- `inset-0` — Top, right, bottom, left = 0 (memenuhi layar)
- `z-50` — Stacking order tinggi, muncul di atas semua elemen

**Backdrop:**
```jsx
<div className="absolute inset-0 bg-black/40" onClick={onCancel} />
```
- Layer hitam semi-transparan di belakang modal
- Klik di backdrop = cancel
- Di atas backdrop ada modal putih (`relative`)

**Ikon peringatan:**
```jsx
<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
  <AlertTriangle className="w-5 h-5 text-red-600" />
</div>
```
Lingkaran merah muda (`bg-red-100`) dengan ikon segitiga peringatan merah — menandakan aksi berbahaya.

**Tombol:**
- "Batal" — border abu-abu, hover background abu-abu tipis
- "Hapus" — background merah, hover lebih gelap

Dengan default `type="button"` pada kedua tombol (tidak perlu disebut eksplisit karena bukan di dalam form).

---

## 9. Pages

### 9.1 Login

**Konsep:**
Halaman login memiliki:
- Form dengan field email dan password
- Validasi real-time (setiap kali user mengetik, validasi berjalan)
- Eye toggle untuk show/hide password
- Link ke halaman register
- Error handling: field-specific error (dari server) dan form-level error

Buat file `src/pages/Login.jsx`:

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

**Penjelasan per bagian:**

**State:**
```javascript
const [form, setForm] = useState({ email: '', password: '' });
const [showPassword, setShowPassword] = useState(false);
const [errors, setErrors] = useState({});
```
- `form` — Nilai input fields
- `showPassword` — Boolean untuk toggle visibilitas password
- `errors` — Object berisi pesan error. Key = nama field, value = pesan error. Contoh: `{ email: 'Email wajib diisi.', password: 'Password wajib diisi.' }`

**Validasi real-time (`handleChange` + `validateField`):**
```javascript
const handleChange = (field, value) => {
  setForm({ ...form, [field]: value });
  validateField(field, value);
};
```
Setiap kali user mengetik di input:
1. Update state `form` dengan nilai baru
2. Jalankan `validateField` untuk field tersebut

**`validateField`:**
Menerima nama field dan nilai, lalu menentukan pesan error:
- `email`: required + format regex
- `password`: required

Pesan error disimpan di state `errors`. Jika tidak ada error, pesan diset ke string kosong.

Ketika input memiliki error, border menjadi merah (`border-red-400`) dan pesan error muncul di bawah input.

**`validate` (untuk submit):**
Validasi semua field sekaligus. Return object error. Digunakan saat user klik tombol submit (lapisan validasi kedua).

**Email regex:**
```javascript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
- `^[^\s@]+` — Satu atau lebih karakter yang bukan spasi atau @ (nama user)
- `@` — Karakter @
- `[^\s@]+` — Satu atau lebih karakter yang bukan spasi atau @ (domain)
- `\.` — Tanda titik
- `[^\s@]+$` — Satu atau lebih karakter yang bukan spasi atau @ (TLD)

**Eye toggle:**
```jsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 ..."
>
  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</button>
```
- Posisi absolut di kanan input (`right-3`, `top-1/2`, `-translate-y-1/2` untuk vertical center)
- Jika `showPassword` true, input bertipe `text` (password terlihat) dan ikon `EyeOff`
- Jika `showPassword` false, input bertipe `password` (tersembunyi) dan ikon `Eye`

**Submit handler:**
```javascript
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
```

1. `e.preventDefault()` — Mencegah reload halaman (default behavior form submit)
2. Validasi semua field. Jika ada error, hentikan proses
3. Kirim POST request ke `/auth/login` dengan data form
4. Jika sukses:
   - Simpan token ke `localStorage` — digunakan untuk autentikasi request berikutnya
   - Simpan data user ke `localStorage` (di-stringify karena localStorage hanya menyimpan string)
   - Panggil `onLogin()` — memberitahu App untuk membaca ulang user dari localStorage
   - Redirect ke halaman utama (`/`)
5. Jika error:
   - Jika server mengembalikan `{ field: 'email', message: '...' }`, error ditampilkan di field yang sesuai
   - Jika tidak, error ditampilkan di atas form sebagai alert merah (`errors.form`)

### 9.2 Register

**Konsep:**
Halaman register mirip dengan login, tetapi dengan tambahan:
- Field "Nama" dan "Konfirmasi Password"
- Validasi tambahan: nama min 2 karakter, password min 6 karakter, confirm password harus cocok
- Dua eye toggle: satu untuk password, satu untuk confirm password

Buat file `src/pages/Register.jsx`:

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

**Penjelasan perbedaan dengan Login:**

**4 fields:**
- `nama` — Nama lengkap user
- `email` — Email
- `password` — Password
- `confirmPassword` — Konfirmasi password (tidak dikirim ke server, hanya untuk validasi client-side)

**Validasi tambahan di `validate`:**
- Nama: `required` + min 2 karakter (`trim().length < 2`)
- Password: `required` + min 6 karakter
- Konfirmasi password: harus sama dengan `form.password`

**Validasi cross-field di `validateField` untuk password:**
```javascript
if (field === 'password') {
  ...
  if (form.confirmPassword && value !== form.confirmPassword) {
    setErrors((prev) => ({ ...prev, confirmPassword: 'Konfirmasi password tidak cocok.' }));
  } else {
    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
  }
}
```
Saat user mengetik password, validasi confirm password juga dijalankan (jika sudah diisi). Ini memberikan feedback real-time bahwa confirm password perlu diubah.

**Dua eye toggle:**
Satu untuk `password` (state `showPassword`) dan satu untuk `confirmPassword` (state `showConfirm`). Masing-masing independen.

### 9.3 Dashboard

**Konsep:**
Dashboard adalah halaman utama setelah login. Fungsinya:
- Menampilkan daftar tugas milik user yang login
- Filter berdasarkan status (Semua, Pending, In Progress, Done)
- Pencarian dengan debounce (300ms)
- Pagination
- Tombol Tambah Tugas, Edit, Hapus
- Loading state dan empty state
- Konfirmasi hapus via ConfirmModal

Buat file `src/pages/Dashboard.jsx`:

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

**Penjelasan per bagian:**

**State:**
```javascript
const [tasks, setTasks] = useState([]);
const [filter, setFilter] = useState('');
const [search, setSearch] = useState('');
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(true);
const [deleteTarget, setDeleteTarget] = useState(null);
const debounceRef = useRef(null);
```
- `tasks` — Array tugas dari API
- `filter` — Status filter: `''` (Semua), `'pending'`, `'in-progress'`, `'done'`
- `search` — Kata kunci pencarian
- `page` — Halaman current
- `totalPages` — Total halaman (dari response API)
- `loading` — Loading state
- `deleteTarget` — Tugas yang akan dihapus (object atau null). Digunakan untuk mengontrol ConfirmModal
- `debounceRef` — Referensi ke timeout ID untuk debounce

**`statusConfig`:**
```javascript
const statusConfig = {
  pending: { label: 'Pending', icon: Circle, class: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  'in-progress': { label: 'In Progress', icon: Clock, class: 'text-blue-500 bg-blue-50 border-blue-200' },
  done: { label: 'Done', icon: CheckCircle, class: 'text-green-500 bg-green-50 border-green-200' },
};
```
Mapping status ke konfigurasi tampilan:
- `label` — Teks yang ditampilkan
- `icon` — Komponen Lucide icon
- `class` — Class Tailwind untuk warna badge

Warna badge:
- `pending` → kuning (menunggu)
- `in-progress` → biru (sedang dikerjakan)
- `done` → hijau (selesai)

**`fetchTasks`:**
```javascript
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
```
- Memanggil endpoint `GET /api/tasks` dengan parameter query
- `page` — Halaman ke berapa
- `limit` — Jumlah item per halaman (10)
- `status` — Filter status (hanya dikirim jika dipilih)
- `search` — Kata kunci pencarian (hanya dikirim jika ada)
- Response API mengembalikan `tasks` dan `pagination.totalPages`

**useEffect untuk reset page:**
```javascript
useEffect(() => {
  setPage(1);
}, [filter, search]);
```
Saat filter atau search berubah, halaman di-reset ke 1. Ini penting agar user tidak berada di halaman 5 lalu filter berubah dan data tidak ditemukan.

**useEffect untuk fetch:**
```javascript
useEffect(() => {
  fetchTasks(search, filter, page);
}, [filter, page]);
```
Saat filter atau page berubah, fetch ulang data. Perhatikan bahwa `search` tidak ada di dependency array — search ditangani oleh `handleSearch` dengan debounce.

**Debounce search:**
```javascript
const handleSearch = (val) => {
  setSearch(val);
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setPage(1);
    fetchTasks(val, filter, 1);
  }, 300);
};
```
Debounce mencegah terlalu banyak request API saat user mengetik. Cara kerja:
1. User mengetik → `handleSearch` dipanggil
2. `setSearch(val)` — update state search (untuk mengontrol nilai input)
3. Hapus timeout sebelumnya (`clearTimeout`)
4. Buat timeout baru: setelah 300ms tanpa perubahan, fetch data
5. Jika user mengetik lagi dalam 300ms, timeout di-reset lagi

**`useRef` untuk debounce:**
`debounceRef` menggunakan `useRef` (bukan `useState`) karena:
- Nilai ref tidak menyebabkan re-render saat berubah
- Kita hanya perlu menyimpan ID timeout, bukan untuk ditampilkan di UI

**Filter buttons:**
```jsx
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
```
- Tombol di-loop dari `statusOptions`
- Tombol aktif mendapat style `bg-blue-600 text-white`
- Tombol tidak aktif: background putih, border abu-abu
- Klik tombol → `setFilter(opt.value)` → `useEffect` mereset page ke 1 + fetch ulang

**Task card:**
Setiap tugas dirender dalam card putih (`bg-white`, `border`, `rounded-xl`, `shadow-sm`):
- **Title** — `font-semibold text-gray-800`
- **Description** — Muncul hanya jika ada (`task.description &&`)
- **Status badge** — `rounded-full` dengan warna sesuai `statusConfig`, icon + label
- **Deadline** — Format `DD/MM/YYYY`, muncul hanya jika ada
- **Tombol Edit** — Ikon pensil, navigasi ke `/edit-tugas/:id`
- **Tombol Hapus** — Ikon tempat sampah, set `deleteTarget` → ConfirmModal muncul

**Pagination:**
- Hanya muncul jika `totalPages > 1`
- Tombol "Sebelumnya": `disabled` saat `page === 1`, ikon `ChevronLeft`
- Label halaman: `{page} / {totalPages}`
- Tombol "Selanjutnya": `disabled` saat `page === totalPages`, ikon `ChevronRight`
- Label "Sebelumnya" dan "Selanjutnya" hanya tampil di layar `sm:` ke atas
- `disabled:opacity-40` — tombol yang dinonaktifkan tampak pudar

**ConfirmModal:**
```jsx
<ConfirmModal
  open={!!deleteTarget}
  title="Hapus Tugas"
  message={`Apakah kamu yakin ingin menghapus tugas "${deleteTarget?.title}"?`}
  onConfirm={handleDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```
- `open={!!deleteTarget}` — `true` jika `deleteTarget` tidak null
- `onConfirm` → `handleDelete`: hapus via API, refresh data
- `onCancel` → set `deleteTarget` ke null (menutup modal)

**Empty state:**
```jsx
: tasks.length === 0 ? (
  <p className="text-gray-500 text-center py-8">Belum ada tugas.</p>
)
```
Menampilkan pesan "Belum ada tugas." jika tidak ada tugas (setelah loading selesai).

**Loading state:**
```jsx
{loading ? (
  <p className="text-gray-500 text-center py-8">Memuat...</p>
) : ...}
```
Menampilkan "Memuat..." selama `loading` true.

### 9.4 TaskForm

**Konsep:**
TaskForm digunakan untuk membuat tugas baru (`/tugas-baru`) dan mengedit tugas yang sudah ada (`/edit-tugas/:id`). Mode ditentukan oleh ada/tidaknya parameter `id` di URL.

Fitur:
- Dual mode: Create (POST) dan Edit (PUT)
- Validasi real-time: title (required, max 255), deadline (format, backdate)
- `min` pada input date = hari ini (mencegah backdate di browser)
- Loading state pada submit
- Tombol "Kembali" ke Dashboard

Buat file `src/pages/TaskForm.jsx`:

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

**Penjelasan per bagian:**

**Deteksi mode:**
```javascript
const { id } = useParams();
const isEdit = Boolean(id);
```
- `useParams()` — Hook React Router yang mengambil parameter dari URL
- Jika URL `/edit-tugas/5` → `id = "5"` → `isEdit = true`
- Jika URL `/tugas-baru` → `id = undefined` → `isEdit = false`

**`today` untuk min date:**
```javascript
const today = new Date().toISOString().split('T')[0];
```
Mendapatkan tanggal hari ini dalam format `YYYY-MM-DD`. Contoh: `2026-07-30`. Nilai ini digunakan sebagai `min` pada input date, sehingga tanggal sebelumnya tidak bisa dipilih di browser.

**Load data untuk Edit:**
```javascript
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
```
Saat mode edit:
1. Fetch data tugas dari `GET /api/tasks/:id`
2. Isi form dengan data tugas
3. Deadline di-split: API mengembalikan format ISO (`2026-08-15T00:00:00.000Z`), kita butuh `YYYY-MM-DD`
4. Jika gagal (misal tugas tidak ditemukan), redirect ke `/`

**`isBackdate` helper:**
```javascript
const isBackdate = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
};
```
Membandingkan tanggal deadline dengan hari ini. `today.setHours(0, 0, 0, 0)` mengatur waktu ke 00:00:00 agar perbandingan hanya berdasarkan tanggal, bukan jam.

**Validasi:**
- **Title:** required (trim), max 255 karakter
- **Deadline:** format `YYYY-MM-DD` (regex), tidak boleh backdate

**Submit:**
```javascript
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
```
- Jika create: `POST /api/tasks` dengan data form
- Jika edit: `PUT /api/tasks/:id` dengan data form
- Setelah sukses: redirect ke Dashboard (`/`)
- `finally` — loading tetap di-set ke false, baik sukses maupun error
- `disabled={loading}` — tombol submit dinonaktifkan saat loading

---

## 10. App.jsx — Routing

**Konsep:**
App.jsx adalah komponen root yang mengatur:
- State user (dibaca dari localStorage)
- Routing semua halaman
- Protected routes (membungkus halaman yang butuh login)
- Lazy loading (code splitting) dengan `React.lazy` dan `Suspense`
- Navbar yang muncul di semua halaman

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

**Penjelasan per bagian:**

**Lazy loading (code splitting):**
```javascript
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskForm = lazy(() => import('./pages/TaskForm'));
```
`React.lazy` memungkinkan komponen di-load **saat dibutuhkan** saja, bukan saat aplikasi pertama kali dimuat. Manfaatnya:
- Ukuran bundle awal lebih kecil
- Halaman yang jarang dikunjungi (misal Register) tidak perlu di-load di awal
- Setiap halaman menjadi file JavaScript terpisah saat build

**Suspense:**
```jsx
<Suspense fallback={<PageLoader />}>
  <Routes>
    ...
  </Routes>
</Suspense>
```
`Suspense` menampilkan `fallback` (komponen loading) saat komponen lazy sedang di-load. `PageLoader` menampilkan teks "Memuat..." di tengah halaman.

**User State:**
```javascript
const storedUser = localStorage.getItem('user');
const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
```
- Saat aplikasi dimuat, baca data user dari localStorage
- Jika ada, parse dari string JSON ke object JavaScript
- Jika tidak ada, `user = null`

**`handleLogin`:**
```javascript
const handleLogin = () => {
  setUser(JSON.parse(localStorage.getItem('user')));
};
```
Dipanggil setelah login/register berhasil. Membaca ulang data user dari localStorage (yang sudah disimpan oleh komponen Login/Register) dan mengupdate state.

**`onLogout` di Navbar:**
```jsx
<Navbar user={user} onLogout={() => setUser(null)} />
```
Saat logout, set user ke `null`. Navbar akan menyembunyikan info user.

**Routing:**

| Path | Komponen | Protection | Behavior |
|------|----------|------------|----------|
| `/login` | Login | Jika sudah login → redirect ke `/` | |
| `/register` | Register | Jika sudah login → redirect ke `/` | |
| `/` | Dashboard | Protected (harus login) | |
| `/tugas-baru` | TaskForm | Protected | Mode create |
| `/edit-tugas/:id` | TaskForm | Protected | Mode edit |
| `*` (catch-all) | Redirect ke `/` | | |

**Route `/login` dan `/register`:**
```jsx
<Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
```
Jika user sudah login (`user` truthy), langsung redirect ke `/`. Ini mencegah user yang sudah login melihat halaman login lagi.

**Protected routes menggunakan `ProtectedRoute`:**
```jsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```
`ProtectedRoute` membungkus komponen halaman. Jika tidak ada token, user di-redirect ke `/login`.

---

## 11. Testing

### 11.1 Setup File

File `src/test/setup.js` sudah dibuat di [Bagian 6](#6-srctestsetupjs--setup-testing). Fungsi utamanya:
- Import `@testing-library/jest-dom` — menyediakan matchers custom
- Mock `window.matchMedia` — mencegah error di lingkungan jsdom

### 11.2 Navbar.test.jsx

Buat file `src/components/Navbar.test.jsx`:

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

**`renderNavbar` helper:**
```javascript
const renderNavbar = (user, onLogout = vi.fn()) => {
  return render(
    <BrowserRouter>
      <Navbar user={user} onLogout={onLogout} />
    </BrowserRouter>
  );
};
```
Helper function untuk merender Navbar dengan:
- `BrowserRouter` — Navbar menggunakan `useNavigate()` yang butuh router context
- Parameter `user` — data user (atau null)
- Parameter `onLogout` — mock function (`vi.fn()`) dengan default value

**`beforeEach` — bersihkan localStorage:**
```javascript
beforeEach(() => {
  localStorage.clear();
});
```
Setiap test dimulai dengan localStorage bersih. Ini mencegah state dari test sebelumnya mempengaruhi test berikutnya.

**Test 1: Render nama aplikasi**
```javascript
it('should render app name', () => {
  renderNavbar(null);
  expect(screen.getByText('Kanggo Todo App')).toBeInTheDocument();
});
```
Memastikan teks "Kanggo Todo App" selalu muncul, bahkan saat user tidak login.

**Test 2: Tampilkan nama user saat login**
```javascript
it('should show user name when logged in', () => {
  renderNavbar({ nama: 'Budi' });
  expect(screen.getByText('Budi')).toBeInTheDocument();
  expect(screen.getByText(/Halo,/)).toBeInTheDocument();
});
```
- `screen.getByText('Budi')` — mencari elemen dengan teks "Budi"
- `screen.getByText(/Halo,/)` — regex, mencari teks yang mengandung "Halo,"

**Test 3: Tampilkan tombol Logout saat login**
```javascript
it('should show logout button when logged in', () => {
  renderNavbar({ nama: 'Budi' });
  expect(screen.getByText('Logout')).toBeInTheDocument();
});
```

**Test 4: Sembunyikan info user saat tidak login**
```javascript
it('should not show user info when not logged in', () => {
  renderNavbar(null);
  expect(screen.queryByText(/Halo,/)).not.toBeInTheDocument();
  expect(screen.queryByText('Logout')).not.toBeInTheDocument();
});
```
Menggunakan `queryByText` (bukan `getByText`) karena queryByText mengembalikan `null` jika tidak ditemukan (tidak throw error). `.not.toBeInTheDocument()` memastikan elemen tidak ada di DOM.

**Test 5: Panggil onLogout saat tombol Logout diklik**
```javascript
it('should call onLogout and clear storage on logout click', () => {
  localStorage.setItem('token', 'abc');
  localStorage.setItem('user', JSON.stringify({ nama: 'Budi' }));

  const onLogout = vi.fn();
  renderNavbar({ nama: 'Budi' }, onLogout);

  fireEvent.click(screen.getByText('Logout'));
  expect(onLogout).toHaveBeenCalled();
});
```
1. Set localStorage seperti setelah login
2. Buat mock function `onLogout`
3. Render Navbar dengan user + mock function
4. Klik tombol "Logout"
5. Verifikasi bahwa `onLogout` telah dipanggil sekali (`toHaveBeenCalled()`)

---

## 12. Cara Menjalankan

### Development

```bash
cd frontend
npm run dev
```
Akses di `http://localhost:5173`. Vite proxy akan meneruskan request `/api` ke backend di `http://localhost:3000`.

### Build Production

```bash
npm run build
npm run preview
```
Build menghasilkan folder `dist/` dengan file HTML, CSS, dan JS yang sudah di-minify.

### Testing

```bash
npm test
```
Menjalankan semua test dengan Vitest. Output akan menampilkan jumlah test yang lolos/gagal.

### Lint

```bash
npm run lint
```
Menjalankan oxlint untuk memeriksa kualitas kode.

---

## Struktur Folder Final

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile
├── .dockerignore
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── api/
    │   └── axios.js
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Navbar.test.jsx
    │   ├── ProtectedRoute.jsx
    │   └── ConfirmModal.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   └── TaskForm.jsx
    └── test/
        └── setup.js
```

---

## Ringkasan Konsep

| Konsep | Penjelasan |
|--------|------------|
| **React 19** | Library untuk membangun UI dengan komponen deklaratif |
| **Vite** | Build tool cepat dengan HMR (Hot Module Replacement) |
| **Tailwind CSS v4** | Utility-first CSS framework (versi 4 pakai Vite plugin) |
| **React Router v7** | Routing SPA — navigasi tanpa reload halaman |
| **Axios** | HTTP client dengan interceptor untuk token & error handling |
| **Lucide React** | Icon library dengan ikon SVG yang konsisten |
| **JWT Authentication** | Token disimpan di localStorage, dikirim via header Authorization |
| **Real-time validation** | Validasi setiap input berubah (onChange), feedback instan |
| **Debounce** | Menunda eksekusi fungsi sampai user selesai mengetik (300ms) |
| **Protected Route** | Redirect ke login jika user belum autentikasi |
| **Route-based code splitting** | `React.lazy` + `Suspense` — load halaman saat dibutuhkan |
| **Pagination** | Membagi data ke beberapa halaman (10 item per halaman) |
| **State lifting** | State user dikelola di App, diturunkan ke Navbar dan halaman |
| **Vitest** | Testing framework cepat untuk Vite project |
| **jsdom** | Simulasi browser di Node.js untuk testing |

Selamat, kamu telah membangun frontend Kanggo Todo App dari nol! 🎉
