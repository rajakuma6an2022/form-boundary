import { type Request, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError, UnauthorizedError } from '../../common/errors';
import { parseBody } from '../../common/validate';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './auth.cookies';
import { getAuth, requireAuth, requireJson, requireSameOrigin } from './auth.middleware';
import { loginSchema, registerSchema } from './auth.schemas';
import { getUserById, loginUser, registerUser, revokeSession, rotateRefreshToken } from './auth.services';

export interface AuthLimits {
  windowMs: number;
  loginPerEmail: number;
  loginPerIp: number;
  registerPerIp: number;
  refreshPerIp: number;
}

export const DEFAULT_AUTH_LIMITS: AuthLimits = {
  windowMs: 60_000,
  loginPerEmail: 5,
  loginPerIp: 30,
  registerPerIp: 10,
  refreshPerIp: 60,
};

function limiter(windowMs: number, limit: number, keyGenerator?: (req: Request) => string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req, _res, next) => {
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'));
    },
  });
}

function emailKey(req: Request): string {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 254) : '__invalid__';
}

function readRefreshCookie(req: Request): string | null {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
}

export function createAuthRouter(overrides: Partial<AuthLimits> = {}): Router {
  const limits = { ...DEFAULT_AUTH_LIMITS, ...overrides };
  const router = Router();
  const guards = [requireJson, requireSameOrigin];

  router.post(
    '/register',
    ...guards,
    limiter(limits.windowMs, limits.registerPerIp),
    async (req, res) => {
      const input = parseBody(registerSchema, req.body);
      const session = await registerUser(input);
      setRefreshCookie(res, session.refreshToken);
      res.status(201).json({ data: { accessToken: session.accessToken, user: session.user } });
    },
  );

  router.post(
    '/login',
    ...guards,
    limiter(limits.windowMs, limits.loginPerIp),
    limiter(limits.windowMs, limits.loginPerEmail, emailKey),
    async (req, res) => {
      const input = parseBody(loginSchema, req.body);
      const session = await loginUser(input);
      setRefreshCookie(res, session.refreshToken);
      res.json({ data: { accessToken: session.accessToken, user: session.user } });
    },
  );

  router.post('/refresh', ...guards, limiter(limits.windowMs, limits.refreshPerIp), async (req, res) => {
    try {
      const session = await rotateRefreshToken(readRefreshCookie(req));
      setRefreshCookie(res, session.refreshToken);
      res.json({ data: { accessToken: session.accessToken, user: session.user } });
    } catch (err) {
      if (err instanceof UnauthorizedError) clearRefreshCookie(res);
      throw err;
    }
  });

  router.post('/logout', ...guards, async (req, res) => {
    await revokeSession(readRefreshCookie(req));
    clearRefreshCookie(res);
    res.status(204).end(); // calling it twice is fine
  });

  router.get('/me', requireAuth, async (_req, res) => {
    const user = await getUserById(getAuth(res).userId);
    res.json({ data: { user } });
  });

  return router;
}