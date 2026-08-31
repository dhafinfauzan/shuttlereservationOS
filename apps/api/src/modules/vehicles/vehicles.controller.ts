import { Request, Response, NextFunction } from 'express';
import { VehiclesService } from './vehicles.service.js';
import { sendSuccess } from '../../lib/response.js';

export class VehiclesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const vehicles = await VehiclesService.list({
        status: status as string,
        search: search as string,
      });
      return sendSuccess(res, vehicles, { total: vehicles.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.getById(req.params.id);
      return sendSuccess(res, vehicle);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.create(req.body);
      return sendSuccess(res, vehicle, undefined, 'Vehicle created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehiclesService.update(req.params.id, req.body);
      return sendSuccess(res, vehicle, undefined, 'Vehicle updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VehiclesService.delete(req.params.id);
      return sendSuccess(res, null, undefined, 'Vehicle deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
