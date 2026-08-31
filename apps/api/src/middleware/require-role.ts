import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { RoleType } from '../config/constants.js';

export const requireRole = (...allowedRoles: (RoleType | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as RoleType)) {
      throw new ForbiddenError(
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`
      );
    }

    next();
  };
};
