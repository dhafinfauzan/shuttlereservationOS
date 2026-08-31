import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../lib/response.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const summary = await DashboardService.getSummary(date as string);
      return sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }

  static async getRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string, 10) || 7;
      const revenue = await DashboardService.getRevenue(days);
      return sendSuccess(res, revenue);
    } catch (err) {
      next(err);
    }
  }

  static async getOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const occupancy = await DashboardService.getOccupancy(date as string);
      return sendSuccess(res, occupancy);
    } catch (err) {
      next(err);
    }
  }

  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const activities = await DashboardService.getActivity(limit);
      return sendSuccess(res, activities, { total: activities.length });
    } catch (err) {
      next(err);
    }
  }
}
