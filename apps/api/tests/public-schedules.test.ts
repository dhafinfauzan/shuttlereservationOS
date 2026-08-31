import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('Public Customer Experience API', () => {
  it('GET /api/v1/public/schedules should return search results for Jakarta -> Bandung', async () => {
    const res = await request(app).get(
      '/api/v1/public/schedules?from=Jakarta&to=Bandung&date=2026-09-05&passengers=1'
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const first = res.body.data[0];
    expect(first.from).toBe('Jakarta');
    expect(first.to).toBe('Bandung');
    expect(first.time).toBeDefined();
    expect(first.arrival).toBeDefined();
    expect(first.price).toBeDefined();
    expect(first.formattedPrice).toMatch(/^Rp/);
  });

  it('GET /api/v1/public/schedules/:tripId/seats should return seat picker layout', async () => {
    const listRes = await request(app).get(
      '/api/v1/public/schedules?from=Jakarta&to=Bandung&date=2026-09-05'
    );
    const tripId = listRes.body.data[0].id;

    const res = await request(app).get(`/api/v1/public/schedules/${tripId}/seats`);

    expect(res.status).toBe(200);
    expect(res.body.data.seats).toHaveLength(12);
    expect(Array.isArray(res.body.data.unavailable)).toBe(true);
  });

  it('POST /api/v1/public/bookings should create customer booking with QRIS simulation', async () => {
    const listRes = await request(app).get(
      '/api/v1/public/schedules?from=Jakarta&to=Bandung&date=2026-09-05'
    );
    const tripId = listRes.body.data[0].id;

    const res = await request(app)
      .post('/api/v1/public/bookings')
      .send({
        tripId,
        customerName: 'Customer Test Flow',
        customerPhone: '0812-4433-2211',
        customerEmail: 'customertest@email.com',
        seatNumbers: ['01'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.bookingCode).toMatch(/^KLN-/);
    expect(res.body.data.accessToken).toHaveLength(64);
    expect(res.body.data.qrisPayload).toBeDefined();
    expect(res.body.data.isSimulation).toBe(true);

    const bookingCode = res.body.data.bookingCode;
    const accessToken = res.body.data.accessToken;

    // View ticket e-ticket
    const ticketRes = await request(app)
      .get(`/api/v1/public/bookings/${bookingCode}`)
      .set('x-booking-token', accessToken);
    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.data.bookingCode).toBe(bookingCode);
    expect(ticketRes.body.data.isPaid).toBe(false);

    // Simulate "Saya sudah bayar" button
    const payRes = await request(app)
      .post(`/api/v1/public/bookings/${bookingCode}/simulate-payment`)
      .set('x-booking-token', accessToken);
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('paid');

    // Re-check ticket is now paid
    const updatedTicket = await request(app)
      .get(`/api/v1/public/bookings/${bookingCode}`)
      .set('x-booking-token', accessToken);
    expect(updatedTicket.body.data.isPaid).toBe(true);
    expect(updatedTicket.body.data.status).toBe('Lunas');
  });

  it('rejects ticket access without the per-booking token', async () => {
    const res = await request(app).get('/api/v1/public/bookings/KLN-0905-6A7');
    expect(res.status).toBe(401);
  });

  it('rejects a passenger count that does not match the selected seats', async () => {
    const trip = await prisma.trip.findFirst({ where: { tripCode: 'KLN-1630' } });
    const res = await request(app)
      .post('/api/v1/public/bookings')
      .send({
        tripId: trip!.id,
        customerName: 'Mismatch Test',
        customerPhone: '081234567890',
        customerEmail: 'mismatch@example.com',
        seatNumbers: ['10'],
        passengerCount: 2,
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
