import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle Prisma Known Request Errors
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target || 'field';
    sendError(res, `Unique constraint violation on ${target}`, 409, 'DUPLICATE_RESOURCE', { target });
    return;
  }

  if ((err as any).code === 'P2025') {
    sendError(res, 'Record to operate not found', 404, 'NOT_FOUND');
    return;
  }

  // Fallback internal server error
  console.error('[UNHANDLED_ERROR]', err);
  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
