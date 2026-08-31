import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Auth Module & RBAC', () => {
  it('should login successfully as Admin CS (Rani Putri)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rani@kelana.test',
        password: 'Admin123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('rani@kelana.test');
    expect(res.body.data.user.role).toBe('admin_cs');
    expect(res.body.data.user.name).toBe('Rani Putri');
  });

  it('should login successfully as Owner', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@kelana.test',
        password: 'Owner123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('owner');
  });

  it('should login successfully as Driver', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'driver.nugraha@kelana.test',
        password: 'Driver123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('driver');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rani@kelana.test',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should fetch /auth/me with valid bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rani@kelana.test',
        password: 'Admin123!',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('rani@kelana.test');
    expect(meRes.body.data.name).toBe('Rani Putri');
  });

  it('should reject access to protected endpoints without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
