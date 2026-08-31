# Kelana Operations Admin

Dashboard React/Vite yang terhubung ke Kelana API. Fitur aktif meliputi autentikasi owner/admin, metrik dan aktivitas real-time dari database, jadwal, pemesanan, master data, serta pembuatan keberangkatan.

Jalankan dari root monorepo:

```bash
cp apps/admin/.env.example apps/admin/.env
npm run dev:admin
```

Default URL: http://127.0.0.1:5174. API dikonfigurasi melalui `VITE_API_URL`.
