import { z } from 'zod';

const mongoUri = z
  .string()
  .regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  MONGODB_URI: mongoUri,
  MONGODB_URI_TEST: mongoUri.optional(),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  CORS_ORIGIN: z.url().transform((value) => new URL(value).origin),
});

export type Env = z.infer<typeof envSchema>;

export class EnvError extends Error {}

/** Pure and testable. Never prints values, only variable names and reasons. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    throw new EnvError(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return result.data;
}

function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (err) {
    if (err instanceof EnvError) {
      console.error(err.message);
      process.exit(1); // fail fast: never start with a bad config
    }
    throw err;
  }
}

export const env = loadEnv();