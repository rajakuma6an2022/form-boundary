import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { connectDb, disconnectDb, pingDb } from '../src/db';

const app = createApp({ ping: pingDb });

describe('ready with a real database', () => {
  beforeAll(async () => {
    await connectDb(process.env.MONGODB_URI_TEST!, { autoIndex: false });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await disconnectDb();
  });

  it('returns 200 while connected', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ready', database: 'up' });
  });

  it('returns 503 after the connection is closed', async () => {
    await disconnectDb();
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('NOT_READY');
  });
});