import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

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

describe('Dashboard Metrics & Charts', () => {
  it('GET /api/v1/dashboard/summary should return daily performance stats', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary?date=2026-08-31')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.bookings).toBeDefined();
    expect(res.body.data.metrics.revenue).toBeDefined();
    expect(res.body.data.metrics.passengers).toBeDefined();
    expect(res.body.data.metrics.availableSeats).toBeDefined();
  });

  it('GET /api/v1/dashboard/revenue should return 7-day revenue series', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/revenue?days=7')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.bars).toHaveLength(7);
    expect(res.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(res.body.data.formattedTotal).toMatch(/^Rp/);
  });

  it('GET /api/v1/dashboard/occupancy should return donut statistics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/occupancy?date=2026-08-31')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.occupancyPercentage).toBeDefined();
    expect(res.body.data.soldSeats).toBeGreaterThan(0);
    expect(res.body.data.totalCapacity).toBeGreaterThan(0);
  });

  it('GET /api/v1/dashboard/activity should return operational live updates', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/activity')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBeDefined();
    expect(res.body.data[0].detail).toBeDefined();
  });
});
