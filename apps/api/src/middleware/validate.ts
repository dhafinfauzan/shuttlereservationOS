import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../lib/errors.js';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
      });
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;
      if (parsed.body) req.body = parsed.body;
      if (parsed.headers) req.headers = parsed.headers;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new ValidationError('Input validation failed', issues));
      } else {
        next(error);
      }
    }
  };
};
