# Kelana Nova

Satu source of truth untuk website pemesanan pelanggan, dashboard operasional, dan REST API Kelana Nova.

## Struktur

- `src/` — website pelanggan (Next.js), port `3000`
- `apps/admin/` — dashboard operasional (Vite + React), port `5174`
- `apps/api/` — API, Prisma, dan SQLite, port `4000`
- `tests/` — audit end-to-end customer dan admin

## Menjalankan lokal

Persyaratan: Node.js 20+ dan npm.

```bash
npm install
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env
npm --workspace kelana-shuttle-admin-be run db:setup
npm run dev
```

Buka:

- Customer: http://127.0.0.1:3000
- Admin: http://127.0.0.1:5174
- API health: http://127.0.0.1:4000/health
- Swagger: http://127.0.0.1:4000/docs

Akun seed admin: `rani@kelana.test` / `Admin123!`. Akun ini hanya untuk development dan wajib diganti untuk deployment.

## Konfigurasi

Frontend customer memakai `NEXT_PUBLIC_API_URL`; admin memakai `VITE_API_URL`. API dikonfigurasi lewat `apps/api/.env`.

Untuk production, `JWT_SECRET` dan `PAYMENT_WEBHOOK_SECRET` wajib diisi dengan secret kuat, `CORS_ORIGIN` harus memuat origin frontend yang eksplisit, dan simulasi pembayaran otomatis nonaktif. Endpoint tiket customer memerlukan token akses booking; webhook pembayaran memerlukan signature HMAC SHA-256.

## Verifikasi

```bash
npm run lint
npm run build:all
npm test
npm run audit:e2e
npm run audit:admin
npm audit
```

Audit E2E menggunakan database `apps/api/prisma/e2e.db`, melakukan seed ulang, menjalankan server sementara, menguji alur browser nyata, lalu mematikan prosesnya.
