import type { RequestHandler, Response } from 'express';
import { env } from '../../common/env';
import { AppError, ForbiddenError, UnauthorizedError } from '../../common/errors';
import { verifyAccessToken } from './auth.token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      auth?: { userId: string };
    }
  }
}

/** Verifies the bearer token and stores the user id for later handlers. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();

  try {
    const { userId } = await verifyAccessToken(token);
    res.locals.auth = { userId };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
  next();
};

export function getAuth(res: Response): { userId: string } {
  if (!res.locals.auth) throw new UnauthorizedError();
  return res.locals.auth;
}

/** CSRF defence #1: only JSON bodies. A cross-site <form> cannot send application/json. */
export const requireJson: RequestHandler = (req, _res, next) => {
  const type = (req.headers['content-type'] ?? '').split(';')[0]?.trim().toLowerCase();
  if (type !== 'application/json') {
    throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
  }
  next();
};

/** CSRF defence #2: the Origin header must be our own site. */
export const requireSameOrigin: RequestHandler = (req, _res, next) => {
  if (req.headers.origin !== env.CORS_ORIGIN) throw new ForbiddenError('Origin not allowed');
  next();
};