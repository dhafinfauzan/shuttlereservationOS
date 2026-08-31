import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env.js';
import { openApiSpec } from './docs/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

import authRouter from './modules/auth/auth.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';
import routesRouter from './modules/routes/routes.routes.js';
import pointsRouter from './modules/points/points.routes.js';
import vehiclesRouter from './modules/vehicles/vehicles.routes.js';
import driversRouter from './modules/drivers/drivers.routes.js';
import tripsRouter from './modules/trips/trips.routes.js';
import bookingsRouter from './modules/bookings/bookings.routes.js';
import manifestRouter from './modules/manifest/manifest.routes.js';
import activityRouter from './modules/activity/activity.routes.js';
import publicRouter from './modules/public/public.routes.js';
import webhooksRouter from './modules/webhooks/webhooks.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // For Swagger UI
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (config.cors.origins.includes(origin) || config.cors.origins.includes('*')) {
          return callback(null, true);
        }
        // Development convenience is intentionally disabled in production.
        if (!config.isProduction && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-signature', 'x-session-id', 'x-booking-token'],
    })
  );

  // Request logger
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
  });
  app.use('/api/', limiter);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many failed login attempts. Please try again later.',
      },
    },
  });

  // Body parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health checks
  const healthHandler = (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'Kelana Nova Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      timezone: config.timezone,
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Give humans a useful landing page while keeping health endpoints machine-readable.
  app.get('/', (_req: Request, res: Response) => res.redirect('/docs/'));

  // OpenAPI Specification & Swagger UI
  app.get('/openapi.json', (req: Request, res: Response) => {
    res.json(openApiSpec);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Mount API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth/login', loginLimiter);
  apiV1.use('/auth', authRouter);
  apiV1.use('/dashboard', dashboardRouter);
  apiV1.use('/routes', routesRouter);
  apiV1.use('/points', pointsRouter);
  apiV1.use('/vehicles', vehiclesRouter);
  apiV1.use('/drivers', driversRouter);
  apiV1.use('/trips', tripsRouter);
  apiV1.use('/bookings', bookingsRouter);
  apiV1.use('/manifest', manifestRouter);
  apiV1.use('/activity', activityRouter);
  apiV1.use('/public', publicRouter);
  apiV1.use('/webhooks', webhooksRouter);

  app.use('/api/v1', apiV1);

  // 404 Handler
  app.use(notFoundHandler);

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
