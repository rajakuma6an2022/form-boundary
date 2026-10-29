import { SignJWT } from 'jose';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { connectDb, disconnectDb, pingDb } from '../src/db';
import { RefreshToken, syncAllIndexes, User } from '../src/modules';
import { ACCESS_AUDIENCE, ACCESS_ISSUER } from '../src/modules/auth/auth.token';

const ORIGIN = new URL(process.env.CORS_ORIGIN!).origin;
const SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const PASSWORD = 'correct-horse-battery';
const HIGH = { windowMs: 60_000, loginPerEmail: 1000, loginPerIp: 1000, registerPerIp: 1000, refreshPerIp: 1000 };

const app = createApp({ ping: pingDb, authLimits: HIGH });

const post = (path: string) =>
  request(app).post(`/api/v1/auth${path}`).set('Origin', ORIGIN).set('Content-Type', 'application/json');

const refresh = (token: string) => post('/refresh').set('Cookie', `rt=${token}`).send({});

function cookiesOf(res: request.Response): string[] {
  return (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
}

function refreshTokenOf(res: request.Response): string {
  const line = cookiesOf(res).find((cookie) => cookie.startsWith('rt='));
  const value = line?.split(';')[0]?.slice(3);
  if (!value) throw new Error('no refresh cookie in response');
  return value;
}

let counter = 0;
async function signUp() {
  const email = `user${++counter}-${Date.now()}@example.com`;
  const res = await post('/register').send({ name: 'Test User', email, password: PASSWORD });
  expect(res.status).toBe(201);
  return {
    email,
    userId: res.body.data.user.id as string,
    accessToken: res.body.data.accessToken as string,
    refreshToken: refreshTokenOf(res),
  };
}

const me = (token: string) => request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

async function makeToken(
  options: { sub?: string; iss?: string; aud?: string; exp?: number; secret?: Uint8Array } = {},
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(options.sub ?? new mongoose.Types.ObjectId().toString())
    .setIssuer(options.iss ?? ACCESS_ISSUER)
    .setAudience(options.aud ?? ACCESS_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(options.exp ?? Math.floor(Date.now() / 1000) + 300)
    .sign(options.secret ?? SECRET);
}

beforeAll(async () => {
  await connectDb(process.env.MONGODB_URI_TEST!, { autoIndex: false });
  await mongoose.connection.dropDatabase(); // safe: setup guard only allows *_test databases
  await syncAllIndexes(); // the unique email index must exist for the duplicate tests
});

afterAll(async () => {
  await disconnectDb();
});

describe('register', () => {
  it('creates the user, returns an access token and sets the refresh cookie', async () => {
    const email = `new-${Date.now()}@example.com`;
    const res = await post('/register').send({ name: 'Raja', email, password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Raja', email });
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const cookie = cookiesOf(res).find((c) => c.startsWith('rt='))!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/api/v1/auth');
  });

  it('stores an argon2id hash, not the password', async () => {
    const s = await signUp();
    const user = await User.findOne({ email: s.email }).select('+passwordHash');
    expect(user?.passwordHash).not.toBe(PASSWORD);
    expect(user?.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('returns 409 for a duplicate email, ignoring case', async () => {
    const s = await signUp();
    const res = await post('/register').send({ name: 'Other', email: s.email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('lets exactly one of two parallel registrations win', async () => {
    const body = { name: 'Race', email: `race-${Date.now()}@example.com`, password: PASSWORD };
    const results = await Promise.all([post('/register').send(body), post('/register').send(body)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('returns 400 for a weak password', async () => {
    const res = await post('/register').send({ name: 'Weak', email: `weak-${Date.now()}@example.com`, password: '123456789' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('123456789');
  });

  it('returns 400 for unknown fields (strict schema)', async () => {
    const res = await post('/register').send({
      name: 'Sneaky',
      email: `sneaky-${Date.now()}@example.com`,
      password: PASSWORD,
      role: 'admin',
    });
    expect(res.status).toBe(400);
  });
});

describe('login', () => {
  it('logs in with the right password', async () => {
    const s = await signUp();
    const res = await post('/login').send({ email: s.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(s.email);
    expect(refreshTokenOf(res)).toBeTruthy();
  });

  it('gives identical errors for a wrong password and an unknown email', async () => {
    const s = await signUp();
    const wrong = await post('/login').send({ email: s.email, password: 'wrong-password-123' });
    const unknown = await post('/login').send({ email: 'nobody@example.com', password: 'wrong-password-123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.code).toBe(unknown.body.error.code);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('rejects the NoSQL operator payload { "$ne": null } with 400', async () => {
    const res = await post('/login').send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('access token', () => {
  it('accepts a valid token', async () => {
    const s = await signUp();
    const res = await me(s.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(s.email);
  });

  it('rejects a missing token', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const s = await signUp();
    const token = await makeToken({ sub: s.userId, exp: Math.floor(Date.now() / 1000) - 60 });
    expect((await me(token)).status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const s = await signUp();
    const [header, payload, signature] = s.accessToken.split('.');
    const forged = { ...JSON.parse(Buffer.from(payload!, 'base64url').toString()), sub: new mongoose.Types.ObjectId().toString() };
    const token = `${header}.${b64(forged)}.${signature}`;
    expect((await me(token)).status).toBe(401);
  });

  it('rejects alg "none"', async () => {
    const s = await signUp();
    const exp = Math.floor(Date.now() / 1000) + 300;
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: s.userId, iss: ACCESS_ISSUER, aud: ACCESS_AUDIENCE, exp })}.`;
    expect((await me(token)).status).toBe(401);
  });

  it('rejects the wrong audience, the wrong issuer and a foreign secret', async () => {
    const s = await signUp();
    expect((await me(await makeToken({ sub: s.userId, aud: 'someone-else' }))).status).toBe(401);
    expect((await me(await makeToken({ sub: s.userId, iss: 'someone-else' }))).status).toBe(401);
    const other = new TextEncoder().encode('a-completely-different-secret-value-123456');
    expect((await me(await makeToken({ sub: s.userId, secret: other }))).status).toBe(401);
  });
});

describe('refresh', () => {
  it('works once and returns a new, working session', async () => {
    const s = await signUp();
    const res = await refresh(s.refreshToken);
    expect(res.status).toBe(200);
    expect(refreshTokenOf(res)).not.toBe(s.refreshToken);
    expect((await me(res.body.data.accessToken)).status).toBe(200);
  });

  it('rejects the old token after it was used', async () => {
    const s = await signUp();
    expect((await refresh(s.refreshToken)).status).toBe(200);
    expect((await refresh(s.refreshToken)).status).toBe(401);
  });

  it('lets exactly one of two parallel refreshes with the same token succeed', async () => {
    const s = await signUp();
    const results = await Promise.all([refresh(s.refreshToken), refresh(s.refreshToken)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
  });

  it('kills the whole family when a used token is replayed', async () => {
    const s = await signUp();
    const first = await refresh(s.refreshToken);
    const newer = refreshTokenOf(first);

    expect((await refresh(s.refreshToken)).status).toBe(401); // replay of the used token
    expect((await refresh(newer)).status).toBe(401); // the legit newer token is dead too
    expect(await RefreshToken.countDocuments({ userId: s.userId })).toBe(0);
  });

  it('returns 401 without a cookie and for an expired token', async () => {
    expect((await post('/refresh').send({})).status).toBe(401);

    const s = await signUp();
    await RefreshToken.updateMany({ userId: s.userId }, { expiresAt: new Date(Date.now() - 1000) });
    expect((await refresh(s.refreshToken)).status).toBe(401);
  });
});

describe('logout', () => {
  it('deletes the family, clears the cookie, and is safe to call twice', async () => {
    const s = await signUp();
    const first = await post('/logout').set('Cookie', `rt=${s.refreshToken}`).send({});
    expect(first.status).toBe(204);
    expect(cookiesOf(first).some((c) => c.startsWith('rt=;'))).toBe(true);
    expect(await RefreshToken.countDocuments({ userId: s.userId })).toBe(0);
    expect((await refresh(s.refreshToken)).status).toBe(401);

    const second = await post('/logout').set('Cookie', `rt=${s.refreshToken}`).send({});
    expect(second.status).toBe(204);
  });
});

describe('request guards', () => {
  const body = { email: 'a@example.com', password: PASSWORD };

  it('rejects a foreign Origin with 403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .set('Content-Type', 'application/json')
      .send(body);
    expect(res.status).toBe(403);
  });

  it('rejects a missing Origin with 403', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send(body);
    expect(res.status).toBe(403);
  });

  it('rejects non-JSON bodies with 415', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=a%40example.com&password=x');
    expect(res.status).toBe(415);
  });
});

describe('rate limits', () => {
  it('returns 429 on the 6th login attempt for the same email within a minute', async () => {
    const limited = createApp({ ping: pingDb }); // default limits, fresh counters
    const attempt = () =>
      request(limited)
        .post('/api/v1/auth/login')
        .set('Origin', ORIGIN)
        .set('Content-Type', 'application/json')
        .send({ email: 'victim@example.com', password: 'wrong-password-123' });

    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const sixth = await attempt();
    expect(sixth.status).toBe(429);
    expect(sixth.body.error.code).toBe('RATE_LIMITED');
  });
});