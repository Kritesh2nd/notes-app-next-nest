# Blueprint Notes — Backend

A standalone **NestJS** REST API for Blueprint Notes, using **TypeORM** against **PostgreSQL**.
This is a separate, independently deployable service from the Next.js frontend in `../frontend`.

## Tech Stack

- NestJS 10 + TypeScript
- TypeORM + PostgreSQL (`pg` driver)
- Passport JWT (`passport-jwt`) reading a session token from an httpOnly cookie
- bcryptjs for password hashing
- class-validator / class-transformer for request DTO validation
- Nodemailer for transactional email (console fallback in dev)

## Getting Started

### 1. Prerequisites
- Node.js 20+
- A running PostgreSQL instance

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
At minimum set:
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — a long random string
- `FRONTEND_URL` — the frontend's origin (used for CORS)
- `APP_URL` — the frontend's URL (used to build links inside emails)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — see **Admin Bootstrap** below

SMTP variables are optional in development: if `SMTP_HOST` is blank, verification and
password-reset emails are logged to the server console instead of sent.

### 4. Run it
```bash
npm run start:dev
```
The API listens on `http://localhost:4000/api` by default (`PORT` in `.env` controls the port).
By default the app auto-creates its database schema on boot (`TYPEORM_SYNC=true`, the default) —
convenient for development. **For production, disable sync and use migrations** (see below).

## Admin Bootstrap (from environment variables)

On **every application startup**, `AdminSeedService` (`src/bootstrap/admin-seed.service.ts`) reads:

```
ADMIN_EMAIL="admin@blueprint-notes.dev"
ADMIN_PASSWORD="Admin@12345"
ADMIN_NAME="Site Admin"
```

and:
- Creates that account as `ADMIN`, pre-verified, if no user with that email exists yet.
- If a user with that email already exists but isn't an admin (or is unverified/banned), it's
  promoted/repaired to a working admin account.
- It **never overwrites an existing admin's password** on restart, so you can change the password
  through the app afterwards without it being reset on the next deploy. Set
  `ADMIN_FORCE_RESET=true` if you specifically want the password reset to `ADMIN_PASSWORD` on
  every boot (useful for resetting a lost admin password in an environment).

If `ADMIN_EMAIL` or `ADMIN_PASSWORD` are unset, bootstrap is skipped with a warning log — no admin
account is auto-created.

## Database Migrations (production)

Development uses `synchronize: true` for convenience. For production:

1. Set `TYPEORM_SYNC=false` in the environment.
2. Generate a migration from your entities:
   ```bash
   npm run migration:generate -- src/database/migrations/Init
   ```
3. Run migrations against the target database as a release step:
   ```bash
   npm run migration:run
   ```

## Tests

End-to-end tests (Jest + Supertest) cover **every endpoint**: health, all 9 auth routes, all 6 notes
routes and all 3 admin routes, plus the admin-from-env bootstrap. They boot the real Nest modules
(guards, pipes, exception filter, interceptor, cookies) against an **in-memory Postgres (pg-mem)**, so
they need no database, SMTP server or Docker, and never write log files.

```bash
npm test            # run everything (~30s)
npm run test:watch
npm run test:cov
```

| File | Covers |
|---|---|
| `test/health.e2e-spec.ts` | `GET /api/health`, 404 envelope |
| `test/auth.e2e-spec.ts` | register, login, logout, me, verify-email, resend-verification, forgot/reset-password, delete account, auto-logout `SESSION_*` codes |
| `test/notes.e2e-spec.ts` | create, list (`?q`, `?favorites`), read, update, favorite, delete; ownership isolation; validation |
| `test/admin.e2e-spec.ts` | 401/403 access control, list users, ban/unban, delete user, self/admin protection |
| `test/admin-seed.e2e-spec.ts` | admin created/repaired from env on startup, idempotency, `ADMIN_FORCE_RESET` |

Each endpoint is tested for the happy path, validation (422), auth (401/403), not-found/ownership
(404), and the structured log events. Note: pg-mem is not real Postgres, so keep a smoke run against
a real database in CI (`docker compose up`) for engine-specific behaviour.

## Session validity / auto-logout

`JwtAuthGuard` re-checks the database on every authenticated request. If the token is valid but
the user was **deleted** or **banned**, or the token is missing/expired, it clears the session cookie
and returns `401` with a machine-readable `code`: `SESSION_USER_DELETED`, `SESSION_USER_BANNED` or
`SESSION_INVALID`. The frontend treats any `SESSION_*` code as "log this user out now" (see
`frontend/src/context/AuthContext.tsx`), and also re-validates the session every 30s and on tab focus.

## Logging

All logging goes through **Winston**, configured in `src/logger/winston.config.ts` and exposed
app-wide via the global `LoggerModule` / `AppLoggerService`. Every log line is structured JSON with
a `timestamp`, `level`, `context` (which service/guard emitted it), and — for application events —
a canonical `event` name.

**Output:**
- Console — human-readable, colorized
- `logs/combined.log` — every INFO+ line, one JSON object per line (rotates at 10MB, keeps 5 files)
- `logs/error.log` — WARN and ERROR only, same format (for quickly finding incidents)

Set `LOG_LEVEL` in `.env` to change verbosity (default `info`).

**Events logged** (`src/logger/log-event.enum.ts` is the source of truth):

| Event | Level | Where |
|---|---|---|
| App started | INFO | `main.ts`, after the server starts listening |
| Database connected | INFO | `DatabaseConnectionLogger`, once TypeORM's DataSource initializes |
| User registered | INFO | `AuthService.register` |
| Login successful | INFO | `AuthService.login` |
| Login failed | WARN | `AuthService.login` (unknown email, wrong password, banned, unverified) |
| Note created | INFO | `NotesService.create` |
| Note read | INFO | `NotesService.findOne` |
| Note updated | INFO | `NotesService.update` / `toggleFavorite` |
| Note deleted | INFO | `NotesService.remove` |
| Unauthorized access | WARN | `JwtAuthGuard` (bad/missing/expired token, banned user) and `AdminGuard` (non-admin hitting an admin route) |
| Admin action | INFO | `AdminService.setBanned` / `remove`, and `AdminSeedService` on bootstrap |
| Database failure | ERROR | Global exception filter (TypeORM `QueryFailedError`) and `main.ts` (startup connection failure) |
| Unexpected exception | ERROR | Global exception filter (any 5xx / unhandled error), plus process-level `unhandledRejection` / `uncaughtException` handlers |

Example line from `logs/combined.log`:
```json
{"level":"info","message":"Login successful: admin@blueprint-notes.dev","timestamp":"2026-09-27T09:31:00.000Z","event":"Login successful","context":"AuthService","userId":"...","email":"admin@blueprint-notes.dev","ip":"::1"}
```

## API Overview

All routes are prefixed with `/api` and return `{ success: boolean, data?, error? }`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, send verification email |
| POST | `/api/auth/login` | — | Sign in, sets `bp_session` httpOnly cookie |
| POST | `/api/auth/logout` | — | Clear session cookie |
| GET  | `/api/auth/me` | Session | Current authenticated user |
| POST | `/api/auth/verify-email` | — | Verify email via token |
| POST | `/api/auth/resend-verification` | — | Resend verification email |
| POST | `/api/auth/forgot-password` | — | Request password reset email |
| POST | `/api/auth/reset-password` | — | Reset password via token |
| DELETE | `/api/auth/account` | Session | Delete own account (password confirmed) |
| GET / POST | `/api/notes` | Session | List (`?q=`, `?favorites=true`) / create notes |
| GET / PATCH / DELETE | `/api/notes/:id` | Session | Read / update / delete a note |
| PATCH | `/api/notes/:id/favorite` | Session | Toggle favorite |
| GET | `/api/admin/users` | Session + Admin | List all users |
| PATCH | `/api/admin/users/:id/ban` | Session + Admin | Ban / unban a user |
| DELETE | `/api/admin/users/:id` | Session + Admin | Delete a user |
| GET | `/api/health` | — | Health check |

## Environment Variables Reference

See `.env.example` for the full annotated list.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Default `4000` |
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Secret used to sign session tokens |
| `JWT_EXPIRES_IN` | No | Session lifetime (default `7d`) |
| `FRONTEND_URL` | Yes | Allowed CORS origin (credentials enabled) |
| `APP_URL` | Yes | Frontend URL, used to build email links |
| `TYPEORM_SYNC` | No | `true` in dev (default); set `false` in prod and use migrations |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | No* | Auto-provisions the admin account on boot |
| `ADMIN_FORCE_RESET` | No | Force-reset admin password to `ADMIN_PASSWORD` on every boot |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | No | SMTP credentials |

\* Required only if you want an admin account auto-created.

## Docker

```bash
docker build -t blueprint-notes-backend .
docker run -p 4000:4000 --env-file .env blueprint-notes-backend
```

Or use the root `docker-compose.yml` to run this alongside Postgres and the frontend together.
