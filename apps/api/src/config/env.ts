import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const getSecret = (name: string, developmentFallback: string): string => {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} is required when NODE_ENV=production`);
  }
  return developmentFallback;
};

export const config = {
  env: nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secret: getSecret('JWT_SECRET', 'kelana-local-development-jwt-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  },
  seatHoldDurationMinutes: parseInt(process.env.SEAT_HOLD_DURATION_MINUTES || '10', 10),
  paymentWebhookSecret: getSecret('PAYMENT_WEBHOOK_SECRET', 'kelana-local-webhook-secret-change-me'),
  allowPaymentSimulation:
    !isProduction && process.env.ALLOW_PAYMENT_SIMULATION !== 'false',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
};
