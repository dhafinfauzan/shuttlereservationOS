import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service.js';
import { sendSuccess } from '../../lib/response.js';
import { config } from '../../config/env.js';
import { ForbiddenError } from '../../lib/errors.js';

export class PublicController {
  static async searchSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, date, passengers } = req.query;
      const schedules = await PublicService.searchSchedules(
        from as string,
        to as string,
        date as string,
        passengers ? parseInt(passengers as string, 10) : 1
      );
      return sendSuccess(res, schedules, { total: schedules.length });
    } catch (err) {
      next(err);
    }
  }

  static async getScheduleSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const seats = await PublicService.getScheduleSeats(req.params.tripId);
      return sendSuccess(res, seats);
    } catch (err) {
      next(err);
    }
  }

  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await PublicService.createBooking(req.body);
      return sendSuccess(res, booking, undefined, 'Pemesanan berhasil dibuat (Menunggu Pembayaran)', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getBookingTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await PublicService.getBookingTicket(
        req.params.bookingCode,
        req.headers['x-booking-token'] as string
      );
      return sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  static async simulatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.allowPaymentSimulation) {
        throw new ForbiddenError('Payment simulation is disabled');
      }
      const result = await PublicService.simulatePayment(
        req.params.bookingCode,
        req.headers['x-booking-token'] as string
      );
      return sendSuccess(res, result, undefined, 'Simulasi pembayaran QRIS berhasil');
    } catch (err) {
      next(err);
    }
  }
}
