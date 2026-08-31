import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import { verifyToken } from '../lib/jwt.js';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header (Bearer token required)');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    throw new UnauthorizedError('Invalid or expired authentication token', 'TOKEN_EXPIRED');
  }
};
