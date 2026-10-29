import type { Response } from 'express';
import { env } from '../../common/env';
import { REFRESH_TTL_MS } from './auth.token';

export const REFRESH_COOKIE = 'rt';

const baseOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/api/v1/auth', // the browser only sends it to auth endpoints
};

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions, maxAge: REFRESH_TTL_MS });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions); // path must match the one used to set it
}