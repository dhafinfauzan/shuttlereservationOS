import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../lib/errors.js';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' does not exist`));
};
