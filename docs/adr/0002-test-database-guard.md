# ADR-002: Test database guard

## Problem
The index tests call `dropDatabase()`. One wrong connection string would wipe real data.

## Options
1. Refuse any Atlas host unless an env flag allows it (stricter, but blocks the common "Atlas test DB" setup).
2. Allow any host, but require the database name to end with `_test` and to differ from `MONGODB_URI`.

## Decision
Option 2, enforced in tests/setup.ts before any test runs (src/common/test-db-guard.ts, unit-tested).
CI uses a local mongo service container (`formboundary_test`); local dev can use a separate `formboundary_test`
database on the same Atlas cluster.

## Trade-off
The guard trusts the database NAME. A mistake that points a `_test`-named URI at a database holding real data is
not caught. Credentials are never logged.

## When I would revisit
If a shared team cluster were used: then use a separate cluster/user for tests.