import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();
let authToken: string;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'rani@kelana.test',
      password: 'Admin123!',
    });
  authToken = loginRes.body.data.token;
});

describe('Bookings Module', () => {
  it('GET /api/v1/bookings should list all bookings with status filters', async () => {
    const res = await request(app)
      .get('/api/v1/bookings?status=Semua')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    // Filter by Lunas
    const lunasRes = await request(app)
      .get('/api/v1/bookings?status=Lunas')
      .set('Authorization', `Bearer ${authToken}`);

    expect(lunasRes.status).toBe(200);
    expect(lunasRes.body.data.every((b: any) => b.status === 'Lunas')).toBe(true);
  });

  it('GET /api/v1/bookings/:id should retrieve booking by code', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/KLN-0905-6A7')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.bookingCode).toBe('KLN-0905-6A7');
    expect(res.body.data.customerName).toBe('Dimas Pratama');
  });

  it('POST /api/v1/bookings should create a new booking with seat reservation', async () => {
    const trip = await prisma.trip.findFirst({
      where: { tripCode: 'KLN-1630' },
    });

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tripId: trip!.id,
        customerName: 'Bambang Sudibyo',
        customerPhone: '0812-9988-7766',
        customerEmail: 'bambang@test.com',
        seatNumbers: ['10'],
        paymentMethod: 'QRIS',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingCode).toMatch(/^KLN-/);
    expect(res.body.data.totalAmount).toBe(155000);
  });

  it('POST /api/v1/bookings/:id/cancel should cancel booking and release seat', async () => {
    const trip = await prisma.trip.findFirst({
      where: { tripCode: 'KLN-1630' },
    });

    // Create booking first
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tripId: trip!.id,
        customerName: 'Test Cancel User',
        customerPhone: '0812-0000-1111',
        customerEmail: 'cancel@test.com',
        seatNumbers: ['11'],
      });

    const bookingId = createRes.body.data.id;

    // Cancel booking
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Customer changed plans' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.bookingStatus).toBe('cancelled');

    // Verify seat 11 is available again
    const seat = await prisma.tripSeat.findUnique({
      where: { tripId_seatNumber: { tripId: trip!.id, seatNumber: '11' } },
    });
    expect(seat!.status).toBe('available');
  });

  it('POST /api/v1/bookings/:id/reschedule should transfer seat and trip atomically', async () => {
    const tripFrom = await prisma.trip.findFirst({ where: { tripCode: 'KLN-1630' } });
    const tripTo = await prisma.trip.findFirst({ where: { tripCode: 'KLN-1000' } });

    // Create initial booking on tripFrom seat 12
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tripId: tripFrom!.id,
        customerName: 'Reschedule User',
        customerPhone: '0812-7777-6666',
        customerEmail: 'reschedule@test.com',
        seatNumbers: ['12'],
      });

    const bookingCode = createRes.body.data.bookingCode;

    // Reschedule to tripTo seat 05
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingCode}/reschedule`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        newTripId: tripTo!.id,
        newSeatNumbers: ['05'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.tripId).toBe(tripTo!.id);

    // Old seat 12 on tripFrom is available
    const oldSeat = await prisma.tripSeat.findUnique({
      where: { tripId_seatNumber: { tripId: tripFrom!.id, seatNumber: '12' } },
    });
    expect(oldSeat!.status).toBe('available');

    // New seat 05 on tripTo is held
    const newSeat = await prisma.tripSeat.findUnique({
      where: { tripId_seatNumber: { tripId: tripTo!.id, seatNumber: '05' } },
    });
    expect(newSeat!.status).toBe('held');
  });
});
