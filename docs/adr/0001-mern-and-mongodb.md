# ADR-001: MERN with MongoDB for FormBoundary

## Problem
Pick a stack and a database for a form builder with public forms and unbounded submissions.

## Options
1. MongoDB + Mongoose (this ADR)

## Decision
MongoDB. A form is one JSON document whose fields are always read and written with it, and capped at 50 fields,
so fields are EMBEDDED in `forms`. Submissions grow without limit, so they live in their OWN collection and
reference the form (never embed an unbounded array). `ownerId` is copied onto submissions so every query can
filter by owner.

## Trade-off
No joins and no foreign keys: ownership rules must be enforced in code and tested. Schema changes are not
enforced by the database, so each submission stores the `formVersion` it was answered against.
Indexes are not created automatically in production (autoIndex off); `npm run db:indexes` does it.

## When I would revisit
If I needed reporting across many forms with relational joins, or strict multi-document transactions.