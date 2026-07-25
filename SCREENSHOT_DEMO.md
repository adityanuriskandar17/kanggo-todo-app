# Skrip Demo Aplikasi Kanggo Todo App

Demo aplikasi manajemen tugas berbasis web yang memungkinkan pengguna untuk mengelola tugas sehari-hari dengan mudah. Aplikasi ini dilengkapi dengan sistem autentikasi JWT, CRUD tugas, fitur pencarian, filter status, serta pagination — semua dibangun dengan arsitektur full-stack modern menggunakan React di frontend dan Express.js di backend dengan database MySQL.

**Link Demo:** [https://todo.adityanuriskandar.com](https://todo.adityanuriskandar.com)

---

## Deskripsi YouTube

**Judul Video:**  
Fullstack Todo App dengan React + Express.js + MySQL | Demo & Tutorial

**Deskripsi:**

```
Di video ini saya mendemonstrasikan aplikasi Kanggo Todo App — sebuah aplikasi 
manajemen tugas full-stack yang dibangun dari nol.

Aplikasi ini mencakup:
✅ Autentikasi JWT (Register, Login, Logout)
✅ CRUD Tugas (Create, Read, Update, Delete)
✅ Filter tugas berdasarkan status (Pending, In Progress, Done)
✅ Live search berdasarkan judul tugas
✅ Pagination
✅ Validasi input real-time (client + server)
✅ Deadline anti backdate
✅ Modal konfirmasi hapus
✅ Proteksi route (redirect jika belum login)
✅ Responsive design (mobile, tablet, laptop)
✅ Deployment ke GCP dengan Nginx + SSL

🛠️ Teknologi:
- Frontend: React 19, Vite, Tailwind CSS v4, React Router v7
- Backend: Node.js, Express.js
- Database: MySQL 8.0
- Autentikasi: JWT + bcryptjs
- Deployment: Google Cloud Platform (e2-small, Ubuntu 24.04)
- Reverse Proxy: Nginx + SSL Let's Encrypt
- Process Manager: PM2

🔗 Link Aplikasi: https://todo.adityanuriskandar.com
📂 Source Code: https://github.com/adityanuriskandar17/kanggo-todo-app

Jangan lupa like, comment, dan subscribe untuk video selanjutnya! 🚀
```

### Tags (copy paste)

```
fullstack, todo app, react, express, mysql, jwt, tailwind css, node js, crud, 
autentikasi, web development, programming, javascript, gcp, deployment, 
nginx, letsencrypt, pm2
```

---

## Teknologi yang Digunakan

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + React Router v7 |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0 |
| **Autentikasi** | JWT (jsonwebtoken) + bcryptjs |
| **HTTP Client** | Axios |
| **Ikon** | Lucide React |
| **Deployment** | GCP e2-small (Ubuntu 24.04) |
| **Reverse Proxy** | Nginx + SSL Let's Encrypt |
| **Process Manager** | PM2 |
| **Testing** | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| **Container** | Docker & Docker Compose |

---

## Sesi 1: Registrasi & Login

### Registrasi

```
Akses: https://todo.adityanuriskandar.com
Klik "Daftar"
```

**Narasi:**

> "Pertama-tama kita akan mendaftarkan akun baru. Silakan isi nama, email, password, dan konfirmasi password."
>
> "Perhatikan, form ini sudah memiliki validasi real-time. Misal saya ketik email tanpa format yang benar, langsung muncul peringatan 'Format email tidak valid' — tanpa perlu klik tombol."
>
> "Sama dengan konfirmasi password, jika tidak cocok akan langsung terlihat."
>
> "Setelah semua valid, klik Daftar. Proses registrasi selesai, kita langsung login dan diarahkan ke dashboard."

### Login

```
Klik "Masuk" (atau akses /login)
```

**Narasi:**

> "Jika sudah punya akun, tinggal masukkan email dan password."
>
> "Kalau email atau password salah, muncul pesan error tanpa refresh halaman."
>
> "Ada juga tombol eye icon untuk melihat password yang diketik."
>
> "Setelah login berhasil, JWT token disimpan di localStorage dan kita diarahkan ke dashboard."

---

## Sesi 2: Dashboard & Daftar Tugas

**Narasi:**

> "Ini adalah halaman utama setelah login. Tampil daftar tugas milik kita."
>
> "Di sini ada beberapa fitur:"

### Filter Status

> "Kita bisa filter tugas berdasarkan status — Semua, Pending, In Progress, atau Done. Cukup klik tombol filternya."

### Pencarian (Live Search)

> "Ada juga fitur pencarian. Ketik judul tugas, hasil akan langsung terfilter secara otomatis dengan delay 300ms — jadi tidak perlu tekan tombol cari."

### Pagination

> "Jika tugas sudah banyak, akan muncul pagination di bawah. Kita bisa klik Sebelumnya dan Selanjutnya."

---

## Sesi 3: Tambah Tugas

```
Klik tombol "Tambah Tugas"
```

**Narasi:**

> "Klik tombol Tambah Tugas di pojok kanan atas."
>
> "Isi judul (wajib), deskripsi (opsional), status, dan deadline."
>
> "Perhatikan: deadline tidak bisa memilih tanggal yang sudah lewat — tanggal backdate di-disable otomatis."
>
> "Klik Buat Tugas. Tugas baru langsung muncul di dashboard."

---

## Sesi 4: Edit Tugas

```
Klik ikon pensil (Edit) pada tugas
```

**Narasi:**

> "Setiap tugas punya tombol Edit (ikon pensil). Klik untuk mengubah judul, deskripsi, status, atau deadline."
>
> "Simpan perubahan, dan tugas langsung terupdate."

---

## Sesi 5: Hapus Tugas

```
Klik ikon tempat sampah (Delete)
```

**Narasi:**

> "Tombol Hapus (ikon tempat sampah) akan memunculkan modal konfirmasi — bukan popup bawaan browser."
>
> "Modal ini lebih proper dan konsisten dengan desain aplikasi. Klik Hapus untuk menghapus, atau Batal untuk membatalkan."

---

## Sesi 6: Logout

```
Klik "Logout" di pojok kanan atas navbar
```

**Narasi:**

> "Tombol Logout ada di navbar. Klik, token dihapus, dan kita kembali ke halaman login."
>
> "Halaman yang membutuhkan autentikasi tidak bisa diakses lagi — akan otomatis redirect ke login."

---

## Sesi 7: Proteksi Route & Token Expired

**Narasi:**

> "Coba akses langsung `/` tanpa login — pasti akan diarahkan ke halaman login."
>
> "Ini karena ada komponen ProtectedRoute yang mengecek keberadaan token di localStorage."
>
> "Kalau token expired atau tidak valid, Axios interceptor otomatis menghapus token dan redirect ke login."

---

## Sesi Tambahan (Opsional): Backend & Deployment

### Backend API

**Narasi:**

> "Backend menggunakan Express.js dengan endpoint RESTful: Register, Login, CRUD Tasks, dan filter."
>
> "Setiap request kecuali register/login harus menyertakan JWT token di header Authorization."
>
> "Validasi dilakukan di dua lapis: client-side (React) dan server-side (Express)."
>
> "Database MySQL dengan tabel users dan tasks yang terelasi."

### Deployment

**Narasi:**

> "Aplikasi dideploy di Google Cloud Platform VM tipe e2-small (2GB RAM, x86_64) dengan Ubuntu 24.04."
>
> "Nginx sebagai reverse proxy dan SSL dari Let's Encrypt."
>
> "PM2 menjaga aplikasi tetap berjalan bahkan setelah reboot."
>
> "Frontend hasil build React diletakkan di folder dist dan disajikan dengan serve."
>
> "Backend Express berjalan di port 3000."
>
> "Semua service bisa dijalankan juga dengan Docker Compose."

---

## Ringkasan Fitur

| Fitur | Status |
|-------|--------|
| Registrasi & Login (JWT) | ✅ |
| Validasi real-time (client + server) | ✅ |
| Eye icon toggle password | ✅ |
| Create, Read, Update, Delete tugas | ✅ |
| Filter berdasarkan status | ✅ |
| Live search by judul | ✅ |
| Pagination | ✅ |
| Deadline tidak bisa backdate | ✅ |
| Modal konfirmasi hapus | ✅ |
| Proteksi route (redirect jika belum login) | ✅ |
| Token expired auto redirect | ✅ |
| Postman collection | ✅ |
| Unit test (backend 7, frontend 5) | ✅ |
| Docker support | ✅ |
| HTTPS (SSL Let's Encrypt) | ✅ |
