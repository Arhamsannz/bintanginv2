# BINTANGIN — Roadmap

## Milestone 1 — Product surface (done)

- Landing page, `/q/$code` activation form + business card view + not-found state, `/admin` dashboard with card table and a fully working bulk QR generator (real PNG/SVG/ZIP downloads, QR codes point at `/q/<code>`).
- Card data lives in an in-memory fixture (`src/data/cards.ts`) so the whole flow — activate, edit, deactivate, search, generate — is clickable and real today, but resets on reload.

## Milestone 2 — Persistent database (done)

- Added a `cards` table (id, code, status, shop_name, review_url, whatsapp, created_at, activated_at) and a `scans` table (id, card_id, scanned_at, user_agent) using Netlify Database + Drizzle. Schema in `db/schema.ts`, migration in `netlify/database/migrations/`.
- `src/data/cards.ts` is now demo/seed fixture only; all reads go through `src/server/cards.server.ts`.

## Milestone 3 — Wire the flows to the database (done)

- `/q/$code`: server function looks up the card by code; activation form submit writes shop name/review URL/WhatsApp and flips status to ACTIVE for real; every load of an active card records a scan (card_id, timestamp, user agent — no personal data).
- `/admin`: dashboard counts, table edits, and deactivation read/write the same tables; QR generator writes `INACTIVE` rows to the database before rendering QR images, and its status badges reflect real card status.

## Milestone 4 — Admin login (done)

- `/admin` is protected by a password check backed by the `ADMIN_PASSWORD` environment variable + a signed session cookie (`src/server/adminSession.ts`, `src/server/auth.functions.ts`). The `requireAdmin` middleware (`src/server/adminMiddleware.ts`) guards the admin-only server functions themselves (`listCards`, `updateCard`, `deactivateCard`, `generateCards`); the `/admin` route's redirect to `/admin/login` is just UX on top of that.

## Milestone 5 — Scan analytics

- Add "scans today", "scans last 7 days", and "total scans" to the dashboard, computed from the `scans` table.

## Milestone 6 — Production hardening

- Deploy config, `.env.example` with the database/auth variables to set on your host, and a review pass on edge cases (duplicate codes, malformed input, large bulk-generate runs).

## Milestone 7 — Host-agnostic deploy (done)

- Swapped `drizzle-orm/netlify-db` for `drizzle-orm/neon-http` + `@neondatabase/serverless` (`db/index.ts`), reading a plain `DATABASE_URL` — works with a claimed/standalone Neon database from any host. Removed `@netlify/vite-plugin-tanstack-start` from `vite.config.ts`, so `vite build` now produces the default Node server output (`.output/server/index.mjs`, run via `pnpm start`). `drizzle.config.ts` now takes `dbCredentials.url` from `DATABASE_URL` so `npx drizzle-kit migrate` can be run manually against any target. `netlify.toml` is no longer needed and can be deleted.
