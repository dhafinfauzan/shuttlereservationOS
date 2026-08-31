import { createApp } from './app.js';
import { config } from './config/env.js';
import { SeatManager } from './lib/seat-manager.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  console.log(`
  =======================================================
  🚀 KELANA NOVA BACKEND SERVER RUNNING
  =======================================================
  - Environment : ${config.env}
  - URL         : http://${config.host}:${config.port}
  - Health Check: http://${config.host}:${config.port}/health
  - API Base    : http://${config.host}:${config.port}/api/v1
  - Swagger Docs: http://${config.host}:${config.port}/docs
  =======================================================
  `);
});

// Periodic seat hold cleanup worker (runs every 60 seconds)
const cleanupInterval = setInterval(async () => {
  try {
    const expiredCount = await SeatManager.cleanupExpiredSeats();
    if (expiredCount > 0) {
      console.log(`[SEAT_CLEANUP] Released ${expiredCount} expired seat holds.`);
    }
  } catch (err) {
    console.error('[SEAT_CLEANUP_ERROR]', err);
  }
}, 60 * 1000);

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  clearInterval(cleanupInterval);

  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
