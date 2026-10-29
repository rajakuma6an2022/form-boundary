# FormBoundary

Form builder: create forms with a drag-and-drop builder, publish a public link, collect and review responses.
MERN: MongoDB + Express 5 + React (Vite) + Node 22.

> Status: Day 1 of 8 (foundation). Auth, builder and public forms are not built yet.

## Requirements
- Node 22 LTS, npm
- A MongoDB Atlas free (M0) cluster

## Setup
```bash
# API
cd api
cp .env.example .env   # then fill in real values
npm install
npm run db:indexes     # creates collections and indexes
npm run dev            # http://localhost:4000/api/v1/health

# Web (second terminal)
cd web
npm install
npm run dev            # http://localhost:5173
```

## Checks
```bash
cd api && npm run typecheck && npm test && npm run build
cd web && npm run lint && npm run typecheck && npm test && npm run build
```

## Known limitations (Day 1)
- Forms screen shows sample data. The API for forms arrives on Day 4.
- The Atlas free tier can be slow on first request.
- Tests need MONGODB_URI_TEST pointing at a database whose name ends with `_test`.

## Docs
Architecture decisions: `docs/adr/`. Daily log: `docs/log.md`.