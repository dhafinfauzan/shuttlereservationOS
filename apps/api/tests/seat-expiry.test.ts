import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { SeatManager } from '../src/lib/seat-manager.js';

const app = createApp();
let authToken: string;

beforeAll(async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rani@kelana.test', password: 'Admin123!' });
  authToken = response.body.data.token;
});

describe('Seat Hold Expiration & Automatic Release', () => {
  it('should auto-release expired seats and allow subsequent booking', async () => {
    const trip = await prisma.trip.findFirst({
      where: { tripCode: 'KLN-1630' },
    });

    const targetSeat = '09';

    // 1. Hold seat with an already-passed expiry date
    const pastDate = new Date(Date.now() - 5000); // 5 seconds ago
    await prisma.tripSeat.update({
      where: { tripId_seatNumber: { tripId: trip!.id, seatNumber: targetSeat } },
      data: {
        status: 'held',
        heldBy: 'expired_session_789',
        heldExpiresAt: pastDate,
      },
    });

    // 2. Trigger cleanup
    const cleaned = await SeatManager.cleanupExpiredSeats();
    expect(cleaned).toBeGreaterThanOrEqual(1);

    // 3. Verify seat is available again
    const seatAfter = await prisma.tripSeat.findUnique({
      where: { tripId_seatNumber: { tripId: trip!.id, seatNumber: targetSeat } },
    });
    expect(seatAfter!.status).toBe('available');
    expect(seatAfter!.heldBy).toBeNull();

    // 4. New customer should now be able to hold seat 09 without conflict
    const holdRes = await request(app)
      .post(`/api/v1/trips/${trip!.id}/hold-seats`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        seatNumbers: [targetSeat],
        referenceId: 'new_customer_session',
        durationMinutes: 10,
      });

    expect(holdRes.status).toBe(200);
    expect(holdRes.body.success).toBe(true);
  });
});
