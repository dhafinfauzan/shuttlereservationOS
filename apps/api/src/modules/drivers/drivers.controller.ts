import { Request, Response, NextFunction } from 'express';
import { DriversService } from './drivers.service.js';
import { sendSuccess } from '../../lib/response.js';

export class DriversController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const drivers = await DriversService.list({
        status: status as string,
        search: search as string,
      });
      return sendSuccess(res, drivers, { total: drivers.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.getById(req.params.id);
      return sendSuccess(res, driver);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.create(req.body);
      return sendSuccess(res, driver, undefined, 'Driver created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await DriversService.update(req.params.id, req.body);
      return sendSuccess(res, driver, undefined, 'Driver updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DriversService.delete(req.params.id);
      return sendSuccess(res, null, undefined, 'Driver deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
