import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/** Requests that no test handler matched. The test fails in afterEach if this is not empty. */
export const unhandledRequests: string[] = [];

// This is the only "initial" handler. server.use() in a test is checked before it, so tests
// override it, and resetHandlers() brings it back after every test.
export const server = setupServer(
  http.all('*', ({ request }) => {
    unhandledRequests.push(`${request.method} ${request.url}`);
    return HttpResponse.error();
  }),
);