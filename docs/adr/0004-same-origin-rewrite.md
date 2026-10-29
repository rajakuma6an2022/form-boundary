# ADR-004: Same-origin API through a Vercel rewrite

## Problem
The SPA (Vercel) and the API (Render) have different domains. A refresh cookie from another domain is a
third-party cookie, which browsers increasingly block, and it would need CORS with credentials.

## Options
1. Call the Render URL directly with CORS + `SameSite=None; Secure` cookies.
2. Vercel rewrites `/api/*` to Render, so the browser only talks to its own origin (this ADR).
3. Serve the built SPA from Express (one origin, one service).

## Decision
Option 2. The cookie becomes first-party (host-only, HttpOnly, Secure, SameSite=Lax, path /api/v1/auth) and
production needs no CORS. `CORS_ORIGIN` is still used by the server to check the `Origin` header on auth writes.
Fallback: option 3, if the rewrite does not forward Set-Cookie or Origin correctly.

## Trade-off
- Every API call has an extra hop (Vercel then Render).
- Behind two proxies, Express with `trust proxy = 1` most likely sees Vercel's address, not the visitor's, so
  per-IP rate limits (register, login-per-IP, refresh) are probably shared by all visitors. The per-email login limit
  is unaffected. Not fixed because I cannot verify the forwarded-header chain without measuring it.
- Vercel preview deployments have a different Origin, so sign-in fails there (403).
- Render's free tier sleeps: the first request after idle can take up to a minute.

## When I would revisit
When real traffic needs per-visitor limits: set trust proxy to the verified hop count and confirm with a debug
log of req.ip, or move to a shared rate-limit store.