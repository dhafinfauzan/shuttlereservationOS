import { Request, Response, NextFunction } from 'express';
import { TripsService } from './trips.service.js';
import { sendSuccess } from '../../lib/response.js';

export class TripsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, routeId, status, search } = req.query;
      const trips = await TripsService.list({
        date: date as string,
        routeId: routeId as string,
        status: status as string,
        search: search as string,
      });
      return sendSuccess(res, trips, { total: trips.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getById(req.params.id);
      return sendSuccess(res, trip);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.create(req.body, req.user?.userId);
      return sendSuccess(res, trip, undefined, 'Trip schedule created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.update(req.params.id, req.body);
      return sendSuccess(res, trip, undefined, 'Trip updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await TripsService.delete(req.params.id);
      return sendSuccess(res, null, undefined, 'Trip deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const seats = await TripsService.getSeats(req.params.id);
      return sendSuccess(res, seats);
    } catch (err) {
      next(err);
    }
  }

  static async holdSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { seatNumbers, referenceId, durationMinutes } = req.body;
      const result = await TripsService.holdSeats(
        req.params.id,
        seatNumbers,
        referenceId,
        durationMinutes
      );
      return sendSuccess(res, result, undefined, 'Seats held successfully');
    } catch (err) {
      next(err);
    }
  }

  static async releaseSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { seatNumbers, referenceId } = req.body;
      await TripsService.releaseSeats(req.params.id, seatNumbers, referenceId);
      return sendSuccess(res, null, undefined, 'Seats released successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const manifest = await TripsService.getManifest(req.params.id);
      return sendSuccess(res, manifest);
    } catch (err) {
      next(err);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes } = req.body;
      const updated = await TripsService.checkIn(
        req.params.id,
        req.params.manifestId,
        status,
        notes,
        req.user?.userId
      );
      return sendSuccess(res, updated, undefined, 'Passenger check-in status updated');
    } catch (err) {
      next(err);
    }
  }
}
