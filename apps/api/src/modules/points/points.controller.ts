import { Request, Response, NextFunction } from 'express';
import { PointsService } from './points.service.js';
import { sendSuccess } from '../../lib/response.js';

export class PointsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, type, search } = req.query;
      const points = await PointsService.list({
        city: city as string,
        type: type as string,
        search: search as string,
      });
      return sendSuccess(res, points, { total: points.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const point = await PointsService.getById(req.params.id);
      return sendSuccess(res, point);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const point = await PointsService.create(req.body);
      return sendSuccess(res, point, undefined, 'Point created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const point = await PointsService.update(req.params.id, req.body);
      return sendSuccess(res, point, undefined, 'Point updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PointsService.delete(req.params.id);
      return sendSuccess(res, null, undefined, 'Point deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
