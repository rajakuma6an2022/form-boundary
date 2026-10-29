import { createHash, randomBytes } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../../common/env';

export const ACCESS_ISSUER = 'formboundary-api';
export const ACCESS_AUDIENCE = 'formboundary-web';
export const ACCESS_TTL = '15m';
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ACCESS_ISSUER)
    .setAudience(ACCESS_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secret);
}

/** Pins algorithm, issuer and audience. Throws on anything wrong (expired, tampered, alg none...). */
export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    issuer: ACCESS_ISSUER,
    audience: ACCESS_AUDIENCE,
  });
  if (!payload.sub) throw new Error('token has no subject');
  return { userId: payload.sub };
}

/** Opaque refresh token: 32 random bytes. It is NOT a JWT. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only this hash is stored, so a database leak does not leak usable tokens. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}