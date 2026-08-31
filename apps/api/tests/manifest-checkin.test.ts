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

describe('Manifest & Check-in Operations', () => {
  it('GET /api/v1/trips/:id/manifest should return manifest list', async () => {
    const trip = await prisma.trip.findFirst({
      where: { tripCode: 'KLN-1000' },
    });

    const res = await request(app)
      .get(`/api/v1/trips/${trip!.id}/manifest`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tripCode).toBe('KLN-1000');
    expect(Array.isArray(res.body.data.manifest)).toBe(true);
    expect(res.body.data.manifest.length).toBeGreaterThan(0);
  });

  it('PATCH /api/v1/trips/:id/manifest/:manifestId/check-in should update passenger status to checked_in', async () => {
    const manifest = await prisma.manifest.findFirst({
      where: { checkInStatus: 'pending' },
    });

    expect(manifest).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/trips/${manifest!.tripId}/manifest/${manifest!.id}/check-in`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'checked_in',
        notes: 'Checked-in via mobile gate',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.checkInStatus).toBe('checked_in');
    expect(res.body.data.checkedInAt).toBeDefined();
  });
});
