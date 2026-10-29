import { Router } from 'express';
import { AppError } from '../common/errors';
import { logger } from '../common/logger';

export function healthRouter({ ping }: { ping: () => Promise<void> }): Router {
  const router = Router();

  // Liveness: the process is up. Never touches the database.
  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  // Readiness: can we serve traffic? Needs MongoDB.
  router.get('/ready', async (_req, res) => {
    try {
      await ping();
    } catch (err) {
      logger.warn({ err }, 'readiness check failed');
      throw new AppError(503, 'NOT_READY', 'Database is unreachable');
    }
    res.json({ data: { status: 'ready', database: 'up' } });
  });

  return router;
}