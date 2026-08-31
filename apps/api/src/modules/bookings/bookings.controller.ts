import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service.js';
import { sendSuccess } from '../../lib/response.js';

export class BookingsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, date, tripId, search, page, limit } = req.query;
      const result = await BookingsService.list({
        status: status as string,
        date: date as string,
        tripId: tripId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingsService.getByIdOrCode(req.params.id);
      return sendSuccess(res, booking);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingsService.create(req.body, req.user?.userId);
      return sendSuccess(res, booking, undefined, 'Booking created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingsService.update(req.params.id, req.body);
      return sendSuccess(res, booking, undefined, 'Booking updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body || {};
      const booking = await BookingsService.cancel(req.params.id, reason, req.user?.userId);
      return sendSuccess(res, booking, undefined, 'Booking cancelled successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { newTripId, newSeatNumbers } = req.body;
      const booking = await BookingsService.reschedule(
        req.params.id,
        newTripId,
        newSeatNumbers,
        req.user?.userId
      );
      return sendSuccess(res, booking, undefined, 'Booking rescheduled successfully');
    } catch (err) {
      next(err);
    }
  }
}
