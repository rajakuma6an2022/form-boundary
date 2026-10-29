# ADR-005: Atlas network access 0.0.0.0/0

## Problem
Render free instances have no fixed outbound IP, so an Atlas IP allowlist cannot be used.

## Options
1. Allowlist Render's IP ranges (they change; free tier has no static IP).
2. Allow 0.0.0.0/0 and rely on credentials (this ADR).
3. Paid static IP / private networking.

## Decision
Option 2 for this portfolio project, with a long random database password, a dedicated database user with
access to the `formboundary` database only, and TLS (the default for Atlas).

## Trade-off
Anyone on the internet can attempt to connect, so security depends only on the credentials. The password must never
appear in logs or the repository.

## When I would revisit
Before holding real user data: paid tier with private networking or a static egress IP, then remove 0.0.0.0/0.