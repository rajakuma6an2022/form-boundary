# ADR-003: Short-lived JWT access token + rotating opaque refresh token

## Problem
The SPA needs login that survives a page reload without keeping a long-lived secret in JavaScript.

## Options
1. Server sessions (cookie + session store)
2. Long-lived JWT in localStorage
3. 15-minute JWT in memory + opaque refresh token in an httpOnly cookie, rotated on every use (this ADR)

## Decision
Option 3. Access token: HS256 JWT (sub, iss, aud, exp), verified with the algorithm, issuer and audience pinned.
Refresh token: 32 random bytes, stored only as a SHA-256 hash with userId, familyId and expiry; delivered as an
httpOnly, SameSite=Lax cookie limited to /api/v1/auth. Each refresh atomically marks the old token used and issues
the next one in the same family. If a used token appears again, the whole family is deleted.
CSRF: the cookie only goes to /auth/*, bodies must be application/json, and Origin must equal CORS_ORIGIN.

## Trade-off (what I gave up compared with sessions)
- No instant revocation of an access token: it stays valid up to 15 minutes after logout.
- Strict reuse detection also hits legitimate races: two parallel refreshes with the same token (two tabs, React
  StrictMode) make one of them look like a replay and log the user out everywhere. The client mitigates this with a
  single in-flight refresh promise (Day 3), but multiple tabs can still collide.
- More moving parts than a session cookie.

## When I would revisit
If multi-tab logouts annoy real users: add a short grace window (about 10 seconds) in which a just-used token may
be retried once. If instant revocation is required: use server sessions.