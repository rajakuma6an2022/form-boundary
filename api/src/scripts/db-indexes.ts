import { env } from '../common/env';
import { logger } from '../common/logger';
import { connectDb, disconnectDb } from '../db';
import { syncAllIndexes } from '../models';

async function main(): Promise<void> {
  await connectDb(env.MONGODB_URI, { autoIndex: false });
  await syncAllIndexes();
  logger.info('indexes synced');
  await disconnectDb();
}

main().catch((err) => {
  logger.fatal({ err }, 'db:indexes failed');
  process.exit(1);
});