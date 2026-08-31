import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import crypto from 'crypto';
import { config } from '../src/config/env.js';

const app = createApp();

describe('Payment Webhook & Idempotency Protection', () => {
  it('should process webhook and handle duplicate replays idempotently', async () => {
    // 1. Create a fresh booking waiting for payment
    const trip = await prisma.trip.findFirst({ where: { tripCode: 'KLN-1630' } });

    const createRes = await request(app)
      .post('/api/v1/public/bookings')
      .send({
        tripId: trip!.id,
        customerName: 'Webhook Test User',
        customerPhone: '0812-8888-9999',
        customerEmail: 'webhook@test.com',
        seatNumbers: ['03'],
      });

    const bookingCode = createRes.body.data.bookingCode;
    const eventId = `evt_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const webhookPayload = {
      eventId,
      bookingCode,
      amount: 155000,
      status: 'PAID',
      paymentMethod: 'QRIS',
    };
    const signature = crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(JSON.stringify(webhookPayload))
      .digest('hex');

    // 2. First Webhook Dispatch
    const res1 = await request(app)
      .post('/api/v1/webhooks/payment')
      .set('x-webhook-signature', signature)
      .send(webhookPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.idempotent).toBe(false);
    expect(res1.body.data.bookingStatus).toBe('paid');

    // 3. Second Webhook Dispatch (Duplicate replay of same eventId)
    const res2 = await request(app)
      .post('/api/v1/webhooks/payment')
      .set('x-webhook-signature', signature)
      .send(webhookPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.idempotent).toBe(true);
    expect(res2.body.data.message).toContain('Idempotent replay');

    // 4. Verify booking is paid and seat is locked
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
    });
    expect(booking!.bookingStatus).toBe('paid');
    expect(booking!.paymentStatus).toBe('paid');
  });

  it('rejects unsigned webhook requests', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/payment')
      .send({ eventId: 'unsigned-event', bookingCode: 'KLN-0905-6A7', amount: 1, status: 'PAID' });
    expect(res.status).toBe(401);
  });
});
