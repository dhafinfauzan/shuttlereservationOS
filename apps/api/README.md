# Kelana Nova — Backend & Admin Operations REST API

Backend service resmi untuk operasional shuttle antarkota **Kelana Nova**, dirancang untuk menghubungkan dan menggantikan data dummy pada **Frontend Admin Operations** (`sabrefish`) serta mendukung seluruh alur pemesanan **Frontend Customer Experience** (`Travel`).

---

## 🚀 Ringkasan Arsitektur & Tech Stack

| Komponen | Pilihan Teknologi | Alasan Desain |
| :--- | :--- | :--- |
| **Language & Runtime** | Node.js (v22+) + TypeScript 5.x | Type safety menyeluruh end-to-end, refactoring aman, dan adopsi standar industri. |
| **Web Framework** | Express.js 4.x | Stabil, ekosistem middleware kaya (Helmet, Rate-limit, CORS, Morgan), minim magic. |
| **ORM & Database** | Prisma ORM + SQLite (`dev.db`) | Zero-friction local development (tanpa instalasi engine eksternal), schema migrasi deklaratif, type-safe queries, dan ACID interactive transactions. |
| **Validasi Skema** | Zod 3.x | Validasi runtime pada body, query, dan route params dengan pesan error terstruktur. |
| **Keamanan & Auth** | JWT (jsonwebtoken) + bcryptjs + RBAC | Role-based access control (`owner`, `admin_cs`, `driver`) dan hashing password aman. |
| **Dokumentasi API** | OpenAPI 3.0 + Swagger UI | Dokumentasi interaktif visual di browser via endpoint `/docs` dan JSON di `/openapi.json`. |
| **Pengujian** | Vitest 3.x + Supertest | Unit & integration testing secepat kilat untuk auth, booking, concurrency, dan webhook. |
| **Build & Bundler** | tsup (esbuild) | Kompilasi TypeScript ke bundle CommonJS (`dist/server.js`) dalam hitungan milidetik. |

---

## 📋 Akun Seed & Kredensial Pengujian

Saat menjalankan database seed, akun berikut langsung tersedia untuk login di `POST /api/v1/auth/login`:

| Peran (Role) | Nama Pengguna | Email | Password | Keterangan & Persona UI |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | Budi Santoso | `owner@kelana.test` | `Owner123!` | Akses penuh (Owner Kelana), hak hapus entitas master. |
| **Admin CS** | Rani Putri (RP) | `rani@kelana.test` | `Admin123!` | Administrator operasional (sesuai avatar `RP` di navbar admin). |
| **Driver** | A. Nugraha (AN) | `driver.nugraha@kelana.test` | `Driver123!` | Pengemudi armada `B 7124 KLN` rute Jakarta–Bandung. |
| **Driver** | F. Ramadhan (FR) | `driver.ramadhan@kelana.test` | `Driver123!` | Pengemudi armada `B 7031 KLN` rute Jakarta–Bandung. |

---

## ⚡ Panduan Menjalankan Project

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Setup Environment
File `.env` sudah disediakan. Jika belum ada, salin dari template:
```bash
cp .env.example .env
```

### 3. Sinkronisasi Database & Seed Data
Perintah di bawah akan membuat database lokal SQLite `dev.db`, menjalankan Prisma Client generation, dan mengisi seed data:
```bash
npm run db:setup
```
*Atau jalankan terpisah:*
```bash
npm run prisma:push
npm run prisma:seed
```

### 4. Mode Development
Menjalankan server dengan live auto-reload:
```bash
npm run dev
```
Server aktif di `http://localhost:4000`.

### 5. Menjalankan Automated Tests
Menjalankan 30 automated tests (auth, RBAC/security, booking, seat concurrency lock, expiry, webhook idempotency, manifest):
```bash
npm test
```

### 6. Build & Jalankan Production
```bash
npm run build
npm start
```

---

## 🛡️ Aturan Bisnis & Mekanisme Kunci

### 1. Format Uang & Waktu
- **Mata Uang**: Disimpan sebagai integer murni Rupiah (`basePrice: 145000`), tidak ada float/sub-unit untuk mencegah floating-point rounding error.
- **Zona Waktu**: Menggunakan field `timezone: "WIB"` (Asia/Jakarta) dan ISO 8601 UTC timestamp untuk konsistensi cross-timezone.

### 2. Pencegahan Double-Booking (Atomic Seat Locking)
- Status kursi: `available` ➡️ `held` ➡️ `booked` / `blocked`.
- Saat customer memilih kursi di drawer atau admin menahan kursi, backend mengeksekusi `SeatManager.holdSeats()` dalam `prisma.$transaction`.
- Jika kursi sedang `booked` atau `held` oleh sesi lain dan belum kedaluwarsa, backend langsung mengembalikan HTTP `409 Conflict` dengan kode `SEAT_UNAVAILABLE` dan daftar nomor kursi yang bentrok.

### 3. Expiry Seat Hold & Background Cleanup Worker
- Setiap seat hold memiliki masa kedaluwarsa default **10 menit** (`heldExpiresAt`).
- Server menjalankan background timer setiap **60 detik** serta validasi on-the-fly pada setiap query untuk merilis kursi yang kedaluwarsa kembali menjadi `available` dan menandai booking yang belum dibayar sebagai `expired`.

### 4. Siklus Status Booking Resmi
1. `draft`: Form pemesanan diinisiasi.
2. `seat_held`: Kursi sedang dikunci untuk customer selama 10 menit.
3. `waiting_payment`: Menunggu pembayaran QRIS / transfer.
4. `paid`: Pembayaran terkonfirmasi oleh webhook gateway atau simulasi operator.
5. `expired`: Batas waktu pembayaran habis tanpa konfirmasi.
6. `cancelled`: Pemesanan dibatalkan (kursi otomatis dilepas ke publik).

### 5. Webhook Idempoten & Simulasi Pembayaran
- Frontend **tidak boleh** langsung menandai status `paid` di database.
- Status `paid` diproses melalui endpoint `POST /api/v1/webhooks/payment` dengan idempotency key (`eventId`).
- Pengiriman ulang payload webhook dengan `eventId` yang sama akan diakui (`idempotent: true`) tanpa menduplikasi catatan pembayaran maupun aktivitas log.
- Webhook selalu memvalidasi signature HMAC-SHA256 melalui header `x-webhook-signature`.
- Simulasi pembayaran hanya aktif di non-production dan dapat dimatikan dengan `ALLOW_PAYMENT_SIMULATION=false`.

---

## 📑 Ringkasan Kontrak API (Endpoints)

Dokumentasi interaktif OpenAPI/Swagger dapat diakses langsung pada:
👉 **`http://localhost:4000/docs`** atau **`http://localhost:4000/api-docs`**

### 1. Autentikasi (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Login dengan email dan password.
- `GET /api/v1/auth/me`: Ambil profil user saat ini berdasarkan JWT Bearer token.

### 2. Dashboard Operasional (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/summary`: Ringkasan metrik (pemesanan, pendapatan, penumpang, kursi sisa, % perbandingan).
- `GET /api/v1/dashboard/revenue?days=7`: Time series pendapatan 7 hari / 30 hari untuk bar chart UI.
- `GET /api/v1/dashboard/occupancy`: Data donut keterisian kursi hari ini (persentase, kursi terjual vs total).
- `GET /api/v1/dashboard/activity`: Live update feed aktivitas operasional (pembayaran, order baru, alert, batal).

### 3. Master Data (`/api/v1/routes`, `/points`, `/vehicles`, `/drivers`)
- CRUD lengkap untuk rute, titik jemput/tiba (Blok M, Pasteur, Bekasi Barat), kendaraan HiAce 12 seat, dan pengemudi.

### 4. Jadwal Keberangkatan (`/api/v1/trips`)
- `GET /api/v1/trips`: List jadwal dengan filter tanggal, rute, dan status.
- `POST /api/v1/trips`: Tambah keberangkatan baru (otomatis inisialisasi 12 kursi `01` s/d `12`).
- `GET /api/v1/trips/:id`: Detail jadwal beserta manifest dan kursi.
- `PATCH /api/v1/trips/:id`: Update jadwal.
- `DELETE /api/v1/trips/:id`: Hapus jadwal.
- `GET /api/v1/trips/:id/seats`: Peta status 12 kursi trip.
- `POST /api/v1/trips/:id/hold-seats`: Lock kursi sementara (10 menit).
- `POST /api/v1/trips/:id/release-seats`: Rilis lock kursi.

### 5. Manifest & Check-in (`/api/v1/trips/:id/manifest`)
- `GET /api/v1/trips/:id/manifest`: Daftar manifest penumpang per trip.
- `PATCH /api/v1/trips/:id/manifest/:manifestId/check-in`: Update status check-in penumpang (`checked_in`, `no_show`, `pending`).

### 6. Transaksi Pemesanan (`/api/v1/bookings`)
- `GET /api/v1/bookings`: Tabel pemesanan admin dengan filter status (`Semua`, `Lunas`, `Menunggu`, `Batal`) dan search box.
- `POST /api/v1/bookings`: Buat booking admin.
- `GET /api/v1/bookings/:id`: Ambil detail booking berdasarkan ID atau Booking Code.
- `PATCH /api/v1/bookings/:id`: Update data booking.
- `POST /api/v1/bookings/:id/cancel`: Batalkan booking dan rilis kursi seketika.
- `POST /api/v1/bookings/:id/reschedule`: Reschedule ke trip/kursi lain secara atomik.

### 7. Customer Experience Publik (`/api/v1/public`)
- `GET /api/v1/public/schedules`: Pencarian jadwal customer (filter `from`, `to`, `date`, `passengers`).
- `GET /api/v1/public/schedules/:tripId/seats`: Peta kursi publik dengan list `unavailable: [2, 5, 8, 11]`.
- `POST /api/v1/public/bookings`: Booking mandiri customer dengan payload QRIS simulasi.
- `GET /api/v1/public/bookings/:bookingCode`: Ambil e-ticket dengan header `x-booking-token` yang diterbitkan saat booking dibuat.
- `POST /api/v1/public/bookings/:bookingCode/simulate-payment`: Simulasi klik tombol "Saya sudah bayar" dengan header token yang sama (non-production saja).

### 8. Webhook Idempoten (`/api/v1/webhooks`)
- `POST /api/v1/webhooks/payment`: Webhook pembayaran idempoten dengan validasi signature HMAC-SHA256.

---

## 🔍 Health Check
- `GET /health` dan `GET /api/health`: Memeriksa status uptime server, timezone, dan versi API.
