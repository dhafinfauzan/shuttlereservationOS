import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();
let adminToken: string;
let driverToken: string;

beforeAll(async () => {
  const [admin, driver] = await Promise.all([
    request(app).post('/api/v1/auth/login').send({ email: 'rani@kelana.test', password: 'Admin123!' }),
    request(app).post('/api/v1/auth/login').send({ email: 'driver.nugraha@kelana.test', password: 'Driver123!' }),
  ]);
  adminToken = admin.body.data.token;
  driverToken = driver.body.data.token;
});

describe('Security boundaries', () => {
  it('rejects unknown browser origins', async () => {
    const response = await request(app)
      .get('/api/v1/public/schedules')
      .set('Origin', 'https://evil.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('prevents drivers from reading admin booking data', async () => {
    const response = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(response.status).toBe(403);
  });

  it('requires authentication for manual seat release', async () => {
    const trip = await prisma.trip.findFirstOrThrow();
    const response = await request(app)
      .post(`/api/v1/trips/${trip.id}/release-seats`)
      .send({ seatNumbers: ['01'], referenceId: 'unknown' });
    expect(response.status).toBe(401);
  });

  it('never changes a booked seat through the hold-release endpoint', async () => {
    const bookedSeat = await prisma.tripSeat.findFirstOrThrow({ where: { status: 'booked' } });
    const response = await request(app)
      .post(`/api/v1/trips/${bookedSeat.tripId}/release-seats`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ seatNumbers: [bookedSeat.seatNumber], referenceId: bookedSeat.heldBy || 'booking' });
    expect(response.status).toBe(200);
    const unchanged = await prisma.tripSeat.findUniqueOrThrow({ where: { id: bookedSeat.id } });
    expect(unchanged.status).toBe('booked');
  });
});
