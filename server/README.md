# Portfolio API Server

Production-ready Express 5 + TypeScript backend scaffolded with the
[nodejs-backend-patterns](https://github.com/example/nodejs-backend-patterns)
layered architecture. It lives in `server/` as a **self-contained package**
(own `package.json`, tsconfig, and tests) so it never interferes with the
Next.js frontend in the repo root.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js ≥ 20.12, TypeScript (strict, ESM) |
| HTTP | Express 5 |
| Validation | Zod (env + request schemas) |
| Auth | JWT (access 15m / refresh 7d) + bcryptjs |
| Logging | pino + pino-http (JSON, pretty in dev) |
| Security | helmet, CORS allow-list, compression, rate limiting |
| Data | `IUserRepository` interface + in-memory impl (swap-in for PostgreSQL) |
| Tests | Vitest + supertest |

## Quick start

```bash
cd server
cp .env.example .env    # then fill in JWT secrets
npm install
npm run dev             # tsx watch, http://localhost:3001
```

## Scripts

```bash
npm run dev         # watch mode (tsx)
npm run build       # tsc → dist/
npm start           # node dist/index.js
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

From the repo root, the same commands are available as `npm run server:dev`,
`server:build`, `server:start`, `server:test`, `server:typecheck`.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | Liveness + uptime |
| POST | `/api/auth/register` | – | Create account (5/min/IP) |
| POST | `/api/auth/login` | – | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | – | Exchange refresh token for a new access token |
| GET | `/api/users/me` | Bearer | Current user |
| GET | `/api/users` | Bearer + admin | List all users |

All responses use a standard envelope:
`{ "status": "success"|"error", "message?", "data?" }`.

```bash
curl -s localhost:3001/api/health
curl -s -X POST localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Juan","email":"juan@portfolio.dev","password":"super-secret-123"}'
```

## Architecture

```
src/
├── index.ts              # entry: env, DI, listen, graceful shutdown
├── app.ts                # express factory (security, routes, error handler)
├── config/env.ts         # Zod-validated env (fails fast)
├── di/container.ts       # dependency injection wiring
├── controllers/          # HTTP layer (thin, delegate to services)
├── services/             # business logic (auth, users)
├── repositories/         # data access (IUserRepository + in-memory impl)
├── routes/               # route definitions + validation wiring
├── schemas/              # Zod request schemas
├── middleware/           # auth, validate, rate-limit, error-handler, logging
├── types/                # domain types
└── utils/                # errors (AppError), logger (pino), response helpers
```

Request flow: `route → validate (Zod) → controller → service → repository`.
Errors propagate as `AppError` subclasses to the global error handler, which
maps them to consistent JSON responses and logs operationally.

Controllers get fully typed requests: a handler typed as
`ValidatedRequest<typeof registerSchema>` reads `req.body` with the exact shape
inferred from the schema via `z.infer` (including `.trim()`/`.toLowerCase()`
transformations) — no `as` casts. The `validate()` middleware parses the schema
and writes the transformed output back onto the request.

## Swapping in PostgreSQL

1. `npm i pg` and implement `IUserRepository` with a `pg` `Pool`
   (see the skill reference *PostgreSQL with Connection Pool* for the
   canonical config).
2. Register it in `di/container.ts`:
   ```ts
   container.singleton<IUserRepository>('userRepository', () => new PgUserRepository(pool));
   ```
3. The pool's `close()` is released automatically on graceful shutdown.

## Admin account

Registration always creates a `user` role. To reach `GET /api/users`
(admin-only), set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` — the server
creates the admin on startup and logs it.

## Rate limiting & trust proxy

- General API: 100 req / 15 min per IP; auth endpoints: 5 req / 15 min per IP
  (configurable via `RATE_LIMIT_*` env vars).
- Set `TRUST_PROXY` to the number of trusted reverse-proxy hops in front of
  the app (1 for nginx/Railway/Fly, 0 when running directly on a public port).

## Environment variables

See `.env.example` for the full annotated list. `JWT_SECRET` and
`JWT_REFRESH_SECRET` are required (≥ 32 chars) and the app refuses to start
without them — generate with `openssl rand -hex 32`.

## Known limitations (production hardening backlog)

- **Refresh tokens are not rotated or revocable** — a leaked refresh token
  stays valid for its full TTL (7d). Before production, add rotation
  (mint a new refresh token on every `/refresh`) plus an allow/denylist in
  the data layer.
- **No email verification** — registration activates the account immediately.
- **In-memory data** — all users reset on restart; swap in a real repository
  (see *Swapping in PostgreSQL*).
- **No lint config yet** — typecheck + tests + build run in CI; a server-side
  ESLint/Prettier setup is a follow-up.
