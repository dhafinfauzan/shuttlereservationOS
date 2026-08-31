import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../lib/errors.js';
import { ActivityService } from '../activity/activity.service.js';
import { config } from '../../config/env.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SEAT_STATUS,
  ACTIVITY_TYPE,
} from '../../config/constants.js';

export interface PaymentWebhookPayload {
  eventId: string; // Idempotency key
  provider?: string;
  bookingCode: string;
  amount: number;
  status: 'PAID' | 'SUCCESS' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  timestamp?: string;
  signature?: string;
}

export class WebhooksService {
  static verifySignature(payloadStr: string, signature?: string): boolean {
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(payloadStr)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(signature);
    return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
  }

  static async handlePaymentWebhook(payload: PaymentWebhookPayload) {
    const { eventId, bookingCode, amount, status, provider = 'dummy_simulator' } = payload;

    if (!eventId) {
      throw new BadRequestError('Missing eventId (idempotency key)');
    }

    if (!bookingCode) {
      throw new BadRequestError('Missing bookingCode');
    }

    // 1. Idempotency Check
    const existingLog = await prisma.paymentWebhookLog.findUnique({
      where: { eventId },
    });

    if (existingLog) {
      return {
        idempotent: true,
        status: existingLog.status,
        eventId,
        message: 'Webhook event was already processed previously (Idempotent replay).',
        processedAt: existingLog.processedAt,
      };
    }

    // 2. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        seats: true,
        trip: { include: { route: true } },
      },
    });

    if (!booking) {
      await prisma.paymentWebhookLog.create({
        data: {
          eventId,
          provider,
          bookingCode,
          status: 'failed',
          payload: JSON.stringify(payload),
          response: `Booking '${bookingCode}' not found`,
        },
      });
      throw new NotFoundError(`Booking '${bookingCode}' not found`);
    }

    // 3. Process status update in atomic transaction
    return prisma.$transaction(
      async (tx) => {
        let finalBookingStatus = booking.bookingStatus;
        let finalPaymentStatus = booking.paymentStatus;

        if (status === 'PAID' || status === 'SUCCESS') {
          finalBookingStatus = BOOKING_STATUS.PAID;
          finalPaymentStatus = PAYMENT_STATUS.PAID;

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: finalBookingStatus,
              paymentStatus: finalPaymentStatus,
              paidAt: new Date(),
              heldExpiresAt: null,
            },
          });

          for (const bs of booking.seats) {
            await tx.tripSeat.update({
              where: { id: bs.tripSeatId },
              data: {
                status: SEAT_STATUS.BOOKED,
                heldExpiresAt: null,
              },
            });
          }

          await ActivityService.log(
            {
              type: ACTIVITY_TYPE.PAID,
              title: 'Pembayaran diterima (Webhook)',
              description: `${booking.bookingCode} · ${booking.customerName}`,
              metadata: {
                eventId,
                bookingCode: booking.bookingCode,
                amount: amount || booking.totalAmount,
                provider,
              },
            },
            tx
          );
        } else if (status === 'EXPIRED' || status === 'FAILED' || status === 'CANCELLED') {
          finalBookingStatus = status === 'EXPIRED' ? BOOKING_STATUS.EXPIRED : BOOKING_STATUS.CANCELLED;
          finalPaymentStatus = PAYMENT_STATUS.FAILED;

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              bookingStatus: finalBookingStatus,
              paymentStatus: finalPaymentStatus,
              cancelledAt: new Date(),
              cancelReason: `Payment status: ${status}`,
            },
          });

          for (const bs of booking.seats) {
            await tx.tripSeat.update({
              where: { id: bs.tripSeatId },
              data: {
                status: SEAT_STATUS.AVAILABLE,
                heldBy: null,
                heldExpiresAt: null,
              },
            });
          }
        }

        const log = await tx.paymentWebhookLog.create({
          data: {
            eventId,
            provider,
            bookingCode,
            status: 'processed',
            payload: JSON.stringify(payload),
            response: `Success: marked booking as ${finalBookingStatus}`,
          },
        });

        return {
          idempotent: false,
          status: 'processed',
          eventId: log.eventId,
          bookingCode,
          bookingStatus: finalBookingStatus,
          paymentStatus: finalPaymentStatus,
          message: `Webhook successfully processed for booking '${bookingCode}'.`,
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );
  }
}
