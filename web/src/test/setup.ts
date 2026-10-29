import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server, unhandledRequests } from './server';

beforeAll(() => server.listen());

afterEach(() => {
  cleanup();
  server.resetHandlers();

  const unexpected = unhandledRequests.splice(0);
  if (unexpected.length > 0) {
    throw new Error(`Unhandled request(s) during test: ${unexpected.join(', ')}`);
  }
});

afterAll(() => server.close());