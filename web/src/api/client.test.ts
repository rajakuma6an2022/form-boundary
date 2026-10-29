import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { server } from '../test/server';
import { apiRequest, configureApi } from './client';

const user = { id: 'u1', name: 'Raja', email: 'raja@example.com' };
const thing = z.object({ ok: z.boolean() });
const unauthorized = () =>
  HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, { status: 401 });

let token: string | null;
const onSessionLost = vi.fn();

beforeEach(() => {
  token = 'old';
  onSessionLost.mockClear();
  configureApi({
    getAccessToken: () => token,
    onSession: (session) => {
      token = session.accessToken;
    },
    onSessionLost,
  });
});

describe('401 handling', () => {
  it('shares ONE refresh between 5 simultaneous 401s and retries each request once', async () => {
    let refreshCalls = 0;
    const seen: (string | null)[] = [];
    server.use(
      http.get('*/api/v1/things', ({ request }) => {
        const auth = request.headers.get('authorization');
        seen.push(auth);
        return auth === 'Bearer new' ? HttpResponse.json({ data: { ok: true } }) : unauthorized();
      }),
      http.post('*/api/v1/auth/refresh', async () => {
        refreshCalls += 1;
        await delay(50);
        return HttpResponse.json({ data: { accessToken: 'new', user } });
      }),
    );

    const results = await Promise.all(Array.from({ length: 5 }, () => apiRequest('/things', thing)));

    expect(results).toHaveLength(5);
    expect(refreshCalls).toBe(1);
    expect(seen.filter((auth) => auth === 'Bearer old')).toHaveLength(5);
    expect(seen.filter((auth) => auth === 'Bearer new')).toHaveLength(5);
  });

  it('retries with a newer token without refreshing again', async () => {
    let refreshCalls = 0;
    server.use(
      http.get('*/api/v1/things', ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer new') return HttpResponse.json({ data: { ok: true } });
        token = 'new'; // simulate: another request finished refreshing while this one was in flight
        return unauthorized();
      }),
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ data: { accessToken: 'unexpected', user } });
      }),
    );

    await expect(apiRequest('/things', thing)).resolves.toEqual({ ok: true });
    expect(refreshCalls).toBe(0);
  });

  it('logs out when the refresh itself returns 401', async () => {
    server.use(
      http.get('*/api/v1/things', unauthorized),
      http.post('*/api/v1/auth/refresh', unauthorized),
    );

    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 401 });
    expect(onSessionLost).toHaveBeenCalled();
  });

  it('does NOT log out when the refresh fails because of the network', async () => {
    server.use(
      http.get('*/api/v1/things', unauthorized),
      http.post('*/api/v1/auth/refresh', () => HttpResponse.error()),
    );

    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 401 });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('does not loop: a second 401 after a good refresh is returned as an error', async () => {
    let calls = 0;
    let refreshCalls = 0;
    server.use(
      http.get('*/api/v1/things', () => {
        calls += 1;
        return unauthorized();
      }),
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ data: { accessToken: 'new', user } });
      }),
    );

    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(2);
    expect(refreshCalls).toBe(1);
    expect(onSessionLost).not.toHaveBeenCalled();
  });
});

describe('response handling', () => {
  it('turns a non-JSON error page into an ApiError', async () => {
    server.use(http.get('*/api/v1/things', () => new HttpResponse('<html>Bad gateway</html>', { status: 502 })));
    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' });
  });

  it('rejects a response that does not match the schema', async () => {
    server.use(http.get('*/api/v1/things', () => HttpResponse.json({ data: { ok: 'yes' } })));
    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('turns a network failure into status 0', async () => {
    server.use(http.get('*/api/v1/things', () => HttpResponse.error()));
    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('maps the server error envelope', async () => {
    server.use(
      http.get('*/api/v1/things', () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    );
    await expect(apiRequest('/things', thing)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});