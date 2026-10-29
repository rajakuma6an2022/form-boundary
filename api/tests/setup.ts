import { assertSafeTestDb } from '../src/common/test-db-guard';

try {
  process.loadEnvFile('.env'); // local dev; CI provides real env vars instead
} catch {
  // no .env file: fine
}

assertSafeTestDb(process.env.MONGODB_URI, process.env.MONGODB_URI_TEST);