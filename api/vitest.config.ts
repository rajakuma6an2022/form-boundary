import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false, // test files share one database
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});