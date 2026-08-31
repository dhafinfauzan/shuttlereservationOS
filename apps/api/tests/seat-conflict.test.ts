import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();
let authToken: string;

beforeAll(async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rani@kelana.test', password: 'Admin123!' });
  authToken = response.body.data.token;
});

describe('Seat Locking & Concurrency Conflict Prevention', () => {
  it('should prevent two users from booking or holding the exact same seat (atomic conflict)', async () => {
    const trip = await prisma.trip.findFirst({
      where: { tripCode: 'KLN-1630' },
    });

    const targetSeat = '07';

    // User A holds seat 07
    const holdResA = await request(app)
      .post(`/api/v1/trips/${trip!.id}/hold-seats`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        seatNumbers: [targetSeat],
        referenceId: 'session_user_A_123',
        durationMinutes: 10,
      });

    expect(holdResA.status).toBe(200);
    expect(holdResA.body.success).toBe(true);

    // User B tries to hold seat 07 -> should fail with 409 Conflict
    const holdResB = await request(app)
      .post(`/api/v1/trips/${trip!.id}/hold-seats`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        seatNumbers: [targetSeat],
        referenceId: 'session_user_B_456',
        durationMinutes: 10,
      });

    expect(holdResB.status).toBe(409);
    expect(holdResB.body.success).toBe(false);
    expect(holdResB.body.error.code).toBe('SEAT_UNAVAILABLE');

    // User C tries to directly create booking for seat 07 -> should also fail with 409 Conflict
    const bookingResC = await request(app)
      .post('/api/v1/public/bookings')
      .send({
        tripId: trip!.id,
        customerName: 'User C',
        customerPhone: '0812-3333-2222',
        customerEmail: 'userc@test.com',
        seatNumbers: [targetSeat],
      });

    expect(bookingResC.status).toBe(409);
    expect(bookingResC.body.success).toBe(false);
  });
});
