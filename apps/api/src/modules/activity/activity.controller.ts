import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service.js';
import { sendSuccess } from '../../lib/response.js';

export class ActivityController {
  static async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const activities = await ActivityService.getRecent(limit);
      return sendSuccess(res, activities, { total: activities.length });
    } catch (err) {
      next(err);
    }
  }
}
