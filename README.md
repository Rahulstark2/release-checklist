# ReleaseCheck

A small release checklist tool. Track releases, their due date, a fixed
checklist of release steps, and free-form notes. The status of a release
(`planned` / `ongoing` / `done`) is computed automatically from how many
steps are checked off — it isn't set manually.

- **Frontend**: Vite + React + Tailwind CSS, single-page app (React Router for
  client-side routing between the list and detail views).
- **Backend**: Node.js + Express, REST API.
- **Database**: PostgreSQL.

## Project structure

```
releasecheck/
├── backend/      Express API server
└── frontend/     Vite + React + Tailwind SPA
```

## Running locally

### 1. Database

First, create a PostgreSQL database online (for example, using [Neon](https://neon.tech)) and grab its connection string.

### 2. Backend

Create a `.env` file in the `backend/` directory with the following structure:
```env
DATABASE_URL=postgresql://user:password@ep-example-db-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=4000
DATABASE_SSL=true
```

Then run:
```bash
cd backend
npm install
npm run migrate   # creates the releases table
npm run dev       # starts the API on http://localhost:4000
```

### 3. Frontend

Create a `.env` file in the `frontend/` directory with the following structure:
```env
VITE_API_URL=http://localhost:4000/api/v1
```

Then run:
```bash
cd frontend
npm install
npm run dev       # starts the SPA on http://localhost:5173
```

Open `http://localhost:5173`.

### Running everything with Docker (backend + db only)

```bash
cd backend
docker compose up --build
```

This builds the API image, runs migrations on boot, and brings up Postgres.
The frontend is still run separately with `npm run dev` (or built and served
statically — see Deployment below).

### Running tests

```bash
cd backend
npm test
```

## API endpoints

Base URL: `/api/v1`

| Method | Path              | Description                                              | Body                                                   |
|--------|-------------------|-----------------------------------------------------------|---------------------------------------------------------|
| GET    | `/health`         | Health check                                               | —                                                       |
| GET    | `/steps`          | The fixed list of checklist steps (`{ id, label }[]`)       | —                                                       |
| GET    | `/releases`       | List all releases, most recent date first                  | —                                                       |
| GET    | `/releases/:id`   | Get a single release                                        | —                                                       |
| POST   | `/releases`       | Create a release                                            | `{ name, date, additionalInfo? }`                        |
| PATCH  | `/releases/:id`   | Update a release (any subset of fields)                     | `{ name?, date?, additionalInfo?, steps? }`               |
| DELETE | `/releases/:id`   | Delete a release                                             | —                                                       |

A release object returned by the API looks like:

```json
{
  "id": 1,
  "name": "Version 1.0.1",
  "date": "2022-09-20T00:00:00.000Z",
  "additionalInfo": "",
  "steps": {
    "pr_merged": true,
    "changelog_updated": false,
    "tests_passing": true,
    "github_release_created": false,
    "deployed_demo": false,
    "tested_demo": false,
    "deployed_production": false
  },
  "status": "ongoing",
  "createdAt": "...",
  "updatedAt": "..."
}
```

`status` is always derived server-side from `steps` — it's never accepted as
input. The `steps` object is keyed by step id (see the fixed list in
`backend/src/steps.js`); `PATCH` with a partial `steps` object only updates the
keys you send, e.g. `{ "steps": { "tests_passing": true } }`.

### The 7 release steps (fixed, shared by every release)

1. All relevant GitHub pull requests have been merged
2. CHANGELOG.md files have been updated
3. All tests are passing
4. Release in GitHub created
5. Deployed in demo
6. Tested thoroughly in demo
7. Deployed in production

These aren't stored in their own DB table — every release stores a single
`steps` JSON column of `{ stepId: boolean }`, and the list of valid step ids
is defined once in code (`backend/src/steps.js`). Add/remove a step there and
every release picks it up automatically without a migration.

## Database schema

One table, `releases`:

```sql
CREATE TABLE releases (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  additional_info TEXT DEFAULT '',
  steps JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `steps` stores `{ "pr_merged": true, "changelog_updated": false, ... }` —
  one boolean per fixed step id.
- `status` (planned/ongoing/done) is **not** a column; it's computed on every
  read from `steps` (see `computeStatus` in `backend/src/steps.js`):
  - no step checked → `planned`
  - some steps checked → `ongoing`
  - all steps checked → `done`

Run `npm run migrate` in `backend/` to create this table (it's idempotent —
safe to run multiple times).

## Deployment

Any host that runs Node + Postgres works. A simple split:

- **Database**: a free/hobby Postgres instance (Render, Railway, Neon, Supabase…).
- **Backend**: Render / Railway / Fly.io — set `DATABASE_URL` (and run
  `npm run migrate` once after first deploy, or as a pre-deploy/build step).
- **Frontend**: Vercel / Netlify / Cloudflare Pages — set `VITE_API_URL` to
  the deployed backend's `/api` URL, build command `npm run build`, output
  directory `dist`.

Make sure the backend's CORS config (currently open, `cors()`) and the
frontend's `VITE_API_URL` line up with wherever each one ends up deployed.

## Tech notes / nice-to-haves included

- Releases can be deleted (list view and detail view).
- Responsive layout (Tailwind, works down to mobile widths).
- Dockerfile + docker-compose for running the backend + Postgres locally.
- A small automated test suite for the status-computation logic
  (`backend/test/steps.test.js`, run with `npm test`).
