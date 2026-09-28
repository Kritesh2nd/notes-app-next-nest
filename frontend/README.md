# Blueprint Notes — Frontend

The Next.js (App Router) frontend for Blueprint Notes. This project is **UI only** — all data,
auth, and business logic live in the separate NestJS backend at `../backend`. This app talks to
that API over HTTP; it has no database connection or server-side secrets of its own.

See the root `README.md` for how the two projects fit together, and `../backend/README.md` for
the API.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (blueprint / technical-drawing theme)
- react-markdown + remark-gfm for Markdown note rendering
- Zod for client-side form validation

## Getting Started

```bash
npm install
cp .env.example .env
# edit .env: NEXT_PUBLIC_API_URL should point at the backend, e.g. http://localhost:4000/api
npm run dev
```

Visit http://localhost:3000. The backend (see `../backend`) must be running for anything beyond
the landing/about pages to work — login, notes, and admin all call it directly.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API, including its `/api` prefix |

## Notes on Auth

The backend issues a JWT in an httpOnly cookie (`bp_session`) on login. This frontend never
touches the token directly — `apiFetch()` (see `src/lib/api-client.ts`) always sends
`credentials: "include"` so the browser attaches the cookie automatically on same-site requests.

`src/middleware.ts` only checks whether the cookie is *present* to fast-redirect obviously signed
out visitors away from `/dashboard` and `/admin` — it cannot verify the JWT signature or read the
user's role (that would require duplicating JWT verification here). Real authorization happens on
every API call, enforced by the backend. The `/admin` page additionally does a client-side role
check via `useAuth()` before rendering, redirecting non-admins to `/dashboard`.

**Cross-origin cookies in production:** this setup relies on the frontend and backend being
same-site (e.g. both on `*.yourdomain.com`, or both on `localhost` in dev — cookies ignore port).
If you deploy them on entirely different domains, set the backend's cookie
`sameSite: "none"; secure: true` and serve both over HTTPS, or put both behind a shared reverse
proxy path (e.g. `/api` routed to the backend) so they share an origin.

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api -t blueprint-notes-frontend .
docker run -p 3000:3000 blueprint-notes-frontend
```

Or use the root `docker-compose.yml` to run this alongside the backend and Postgres.
