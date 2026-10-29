import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp({ ping: async () => {} });

describe('health', () => {
  it('returns the success envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('request id', () => {
  it('adds a request id to every response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toMatch(/^[\w-]{8,64}$/);
  });

  it('keeps a safe client-supplied id', async () => {
    const res = await request(app).get('/api/v1/health').set('x-request-id', 'client-id-12345');
    expect(res.headers['x-request-id']).toBe('client-id-12345');
  });

  it('replaces an unsafe client-supplied id', async () => {
    const res = await request(app).get('/api/v1/health').set('x-request-id', 'bad id with spaces!!');
    expect(res.headers['x-request-id']).not.toBe('bad id with spaces!!');
  });
});

describe('error envelope', () => {
  it('returns a 404 envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('returns 400 INVALID_JSON for a broken body', async () => {
    const res = await request(app)
      .post('/api/v1/anything')
      .set('content-type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 413 for a body over 100kb', async () => {
    const res = await request(app)
      .post('/api/v1/anything')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ blob: 'x'.repeat(110_000) }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('hides the message of unexpected (sync and async) errors', async () => {
    const boom = Router();
    boom.get('/boom-sync', () => {
      throw new Error('secret db password leaked');
    });
    boom.get('/boom-async', async () => {
      throw new Error('secret db password leaked');
    });
    const withBoom = createApp({ ping: async () => {}, routers: [boom] });

    for (const path of ['/api/v1/boom-sync', '/api/v1/boom-async']) {
      const res = await request(withBoom).get(path);
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(res.body)).not.toContain('secret');
    }
  });
});

describe('ready (injected ping)', () => {
  it('returns 200 when the ping works', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe('up');
  });

  it('returns 503 and no internals when the ping fails', async () => {
    const failing = createApp({
      ping: async () => {
        throw new Error('connection refused to secret-host:27017');
      },
    });
    const res = await request(failing).get('/api/v1/ready');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_READY');
    expect(JSON.stringify(res.body)).not.toContain('secret-host');
  });
});