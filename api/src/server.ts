import { createApp } from './app';
import { env } from './common/env';
import { logger } from './common/logger';
import { connectDb, disconnectDb, pingDb } from './db';

async function main(): Promise<void> {
  await connectDb(env.MONGODB_URI, { autoIndex: env.NODE_ENV !== 'production' });
  logger.info('mongodb connected');

  const app = createApp({ ping: pingDb });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'api listening');
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');

    const force = setTimeout(() => {
      logger.error('forced exit after timeout');
      process.exit(1);
    }, 10_000);
    force.unref();

    server.close((closeErr) => {
      if (closeErr) logger.error({ err: closeErr }, 'http server close failed');
      void disconnectDb().finally(() => process.exit(closeErr ? 1 : 0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandled rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'startup failed');
  process.exit(1);
});