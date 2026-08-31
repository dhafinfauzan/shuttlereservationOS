export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Kelana Nova - Admin & Operations REST API',
    version: '1.0.0',
    description: `
REST API MVP untuk sistem operasional, admin dashboard, dan pengalaman booking customer Kelana Nova.

### Fitur Utama:
- **Autentikasi & RBAC**: Owner, Admin CS (Rani Putri), dan Driver.
- **Master Data**: Rute, Titik Jemput/Dropoff (Blok M, Pasteur, Bekasi), Armada (HiAce 12 Seat), Driver.
- **Manajemen Jadwal**: Sinkronisasi keberangkatan, kapasitas 12 kursi, status (Terjadwal, Boarding, Berangkat, Penuh).
- **Seat Locking & Anti Double-Booking**: Lock kursi dengan masa berlaku (10 menit) dan rilis otomatis.
- **Transaksi & E-Ticket**: Kode booking standar (contoh: KLN-0905-6A7), status pembayaran, reskedul, dan pembatalan.
- **Manifest & Check-In**: Rekap penumpang per keberangkatan dan status check-in real-time.
- **Dashboard & Live Update**: Metrik ringkasan, chart pendapatan 7/30 hari, occupancy donut, dan activity stream.
- **Simulasi Webhook Idempoten**: Pemrosesan pembayaran dengan proteksi duplikasi (replay protection).
    `,
    contact: {
      name: 'Kelana Nova Engineering',
      email: 'dev@kelana.test',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT token yang didapat dari /auth/login',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input' },
              details: { type: 'object' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'rani@kelana.test' },
          password: { type: 'string', example: 'Admin123!' },
        },
      },
      CreateTripRequest: {
        type: 'object',
        required: [
          'routeId',
          'vehicleId',
          'driverId',
          'departurePointId',
          'arrivalPointId',
          'departureDate',
          'departureTime',
          'arrivalTime',
          'basePrice',
        ],
        properties: {
          routeId: { type: 'string', format: 'uuid' },
          vehicleId: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          departurePointId: { type: 'string', format: 'uuid' },
          arrivalPointId: { type: 'string', format: 'uuid' },
          departureDate: { type: 'string', example: '2026-09-01' },
          departureTime: { type: 'string', example: '18:30' },
          arrivalTime: { type: 'string', example: '21:15' },
          basePrice: { type: 'integer', example: 145000 },
          capacity: { type: 'integer', example: 12 },
          label: { type: 'string', example: 'Malam' },
        },
      },
      PaymentWebhookPayload: {
        type: 'object',
        required: ['eventId', 'bookingCode', 'amount', 'status'],
        properties: {
          eventId: { type: 'string', example: 'evt_sim_981240124' },
          bookingCode: { type: 'string', example: 'KLN-0905-6A7' },
          amount: { type: 'integer', example: 145000 },
          status: { type: 'string', enum: ['PAID', 'SUCCESS', 'EXPIRED', 'FAILED'], example: 'PAID' },
          paymentMethod: { type: 'string', example: 'QRIS' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login admin/driver/owner',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          '200': { description: 'Login successful with JWT token' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Current user profile' },
        },
      },
    },
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Ringkasan performa hari ini (Pemesanan, Pendapatan, Penumpang, Kursi Tersedia)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Dashboard metrics' } },
      },
    },
    '/dashboard/revenue': {
      get: {
        tags: ['Dashboard'],
        summary: 'Data grafik pendapatan 7 hari / 30 hari terakhir',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Revenue chart series' } },
      },
    },
    '/dashboard/occupancy': {
      get: {
        tags: ['Dashboard'],
        summary: 'Data donut chart keterisian kursi hari ini',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Occupancy statistics' } },
      },
    },
    '/dashboard/activity': {
      get: {
        tags: ['Dashboard'],
        summary: 'Live update feed aktivitas operasional',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Recent activity feed' } },
      },
    },
    '/trips': {
      get: {
        tags: ['Trips (Schedules)'],
        summary: 'List operasional jadwal keberangkatan',
        responses: { '200': { description: 'List of trips' } },
      },
      post: {
        tags: ['Trips (Schedules)'],
        summary: 'Tambah keberangkatan baru',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTripRequest' } } },
        },
        responses: { '201': { description: 'Trip created' } },
      },
    },
    '/trips/{id}/seats': {
      get: {
        tags: ['Trips (Schedules)'],
        summary: 'Layout dan status ketersediaan kursi trip',
        responses: { '200': { description: 'Seat map' } },
      },
    },
    '/trips/{id}/manifest': {
      get: {
        tags: ['Manifest & Check-in'],
        summary: 'Manifest penumpang per keberangkatan',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Trip manifest' } },
      },
    },
    '/trips/{id}/manifest/{manifestId}/check-in': {
      patch: {
        tags: ['Manifest & Check-in'],
        summary: 'Update status check-in penumpang',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Check-in updated' } },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'Daftar semua transaksi pemesanan dengan filter status (Semua, Lunas, Menunggu, Batal)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'List of bookings' } },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Buat pemesanan baru',
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Booking created' } },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Batalkan pemesanan dan rilis kursi',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Booking cancelled' } },
      },
    },
    '/bookings/{id}/reschedule': {
      post: {
        tags: ['Bookings'],
        summary: 'Pindahkan jadwal / ganti kursi pemesanan',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Booking rescheduled' } },
      },
    },
    '/public/schedules': {
      get: {
        tags: ['Customer Experience'],
        summary: 'Pencarian jadwal publik (From, To, Date, Passengers)',
        responses: { '200': { description: 'Available schedules' } },
      },
    },
    '/public/bookings': {
      post: {
        tags: ['Customer Experience'],
        summary: 'Pemesanan tiket mandiri oleh customer dengan QRIS simulation',
        responses: { '201': { description: 'Customer booking created' } },
      },
    },
    '/public/bookings/{bookingCode}': {
      get: {
        tags: ['Customer Experience'],
        summary: 'Ambil e-ticket dengan kode booking dan token akses pelanggan',
        parameters: [{ name: 'x-booking-token', in: 'header', required: true, schema: { type: 'string', minLength: 32 } }],
        responses: { '200': { description: 'E-Ticket details' } },
      },
    },
    '/public/bookings/{bookingCode}/simulate-payment': {
      post: {
        tags: ['Customer Experience'],
        summary: 'Simulasi tombol Saya sudah bayar di frontend customer',
        description: 'Hanya tersedia di environment non-production ketika ALLOW_PAYMENT_SIMULATION tidak disetel false.',
        parameters: [{ name: 'x-booking-token', in: 'header', required: true, schema: { type: 'string', minLength: 32 } }],
        responses: { '200': { description: 'Payment simulated' } },
      },
    },
    '/webhooks/payment': {
      post: {
        tags: ['Webhooks'],
        summary: 'Webhook idempoten dari payment gateway simulator',
        parameters: [{ name: 'x-webhook-signature', in: 'header', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentWebhookPayload' } } },
        },
        responses: {
          '200': { description: 'Webhook processed or idempotent replay acknowledged' },
        },
      },
    },
  },
};
