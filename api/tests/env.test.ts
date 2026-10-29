import { describe, expect, it } from 'vitest';
import { EnvError, parseEnv } from '../src/common/env';

const valid = {
  MONGODB_URI: 'mongodb://localhost:27017/app',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  CORS_ORIGIN: 'http://localhost:5173',
};

describe('parseEnv', () => {
  it('accepts a valid config and applies defaults', () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects a missing JWT secret', () => {
    const { JWT_ACCESS_SECRET: _omit, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow(EnvError);
  });

  it('rejects a short JWT secret without printing it', () => {
    const short = 'short-secret-value';
    try {
      parseEnv({ ...valid, JWT_ACCESS_SECRET: short });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvError);
      expect((err as Error).message).toContain('JWT_ACCESS_SECRET');
      expect((err as Error).message).not.toContain(short);
    }
  });

  it('rejects a bad MongoDB URI', () => {
    expect(() => parseEnv({ ...valid, MONGODB_URI: 'postgres://nope' })).toThrow(EnvError);
  });
});