import { Request, Response, NextFunction } from 'express';
import { RoutesService } from './routes.service.js';
import { sendSuccess } from '../../lib/response.js';

export class RoutesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, isActive } = req.query;
      const routes = await RoutesService.list({
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, routes, { total: routes.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await RoutesService.getById(req.params.id);
      return sendSuccess(res, route);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await RoutesService.create(req.body);
      return sendSuccess(res, route, undefined, 'Route created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await RoutesService.update(req.params.id, req.body);
      return sendSuccess(res, route, undefined, 'Route updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RoutesService.delete(req.params.id);
      return sendSuccess(res, null, undefined, 'Route deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
