# GymApps

Workout tracker + AI coach. Next.js fullstack, PostgreSQL, Prisma.

## Phase 1 (Fondasi)

Monorepo `apps/web` + `packages/{db,shared,jobs,domain}` + `infra`.

### Setup

```bash
cp .env.example packages/db/.env
cp .env.example apps/web/.env.local
npm install
npm run gen:api
npm run db:generate
docker compose -f infra/docker-compose.yml up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 — redirects to `/id`.

### Gates

| Gate | Command |
|---|---|
| Install clean | `npm ci` |
| Lint + typecheck | `npm run lint && npm run typecheck` |
| Unit checks | `npm test` (web 6, domain 27) |
| Build | `npm run build` |
| Migration from empty DB | `npm run db:migrate` |
| Seed idempotent | `npm run db:seed` twice, counts stay 20 muscles / 15 equipment |
| Auth flow | register → `/api/v1/auth/me` 200; logout-all revokes both devices |
| Rate limit | 5 failed logins → 6th returns 429 |
| Health | `GET /api/v1/health` |

### Notes

- Phase 1 ships auth + master data only. Program/workout tables arrive in Phase 3.
- Email verification and password reset are not in the Phase 1 deliverable list; email delivery lands with Phase 7.
- `Secure` cookie flag is enabled only in production so localhost works over http.
- Session cookie is refreshed on page navigation by `middleware.ts`, not only by API calls.
- Login rate limit is in-memory per instance until Redis is wired (Phase 4).
- `TRUST_PROXY_HEADERS` defaults to `false`, so spoofed `X-Forwarded-For` cannot change the rate-limit key. Set it to `true` only behind a reverse proxy that overwrites the header.
- Phase 2 domain modules live in `packages/domain` (no React, Next.js, Prisma, or DB).
