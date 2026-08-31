import { Request, Response, NextFunction } from 'express';
import { ManifestService } from './manifest.service.js';
import { sendSuccess } from '../../lib/response.js';

export class ManifestController {
  static async listByTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const manifests = await ManifestService.listByTrip(req.params.tripId);
      return sendSuccess(res, manifests, { total: manifests.length });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkInStatus, notes } = req.body;
      const updated = await ManifestService.updateStatus(
        req.params.id,
        checkInStatus,
        notes,
        req.user?.userId
      );
      return sendSuccess(res, updated, undefined, 'Check-in status updated');
    } catch (err) {
      next(err);
    }
  }
}
