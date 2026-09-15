# AGENTS.md

## Architecture

TanStack Start (React 19 + TanStack Router v1) app, file-based routing under `src/routes/`:

- `src/routes/index.tsx` — landing page
- `src/routes/q/$code.tsx` — activation form / business card view / not-found, keyed by card code
- `src/routes/admin.tsx` — dashboard, card table, QR generator; redirects to `/admin/login` if not authenticated
- `src/routes/admin.login.tsx` — admin password form
- `src/routes/__root.tsx` — root shell, fonts, meta

Supporting modules:

- `db/schema.ts` — Drizzle schema for the `cards` and `scans` tables (Neon Postgres). `db/index.ts` exports the Drizzle client (`drizzle-orm/neon-http` + `@neondatabase/serverless`, connects via `DATABASE_URL` — works on any host, not tied to a specific platform).
- `src/server/cards.functions.ts` — TanStack Start server functions (`getCard`, `listCards`, `activateCard`, `updateCard`, `deactivateCard`, `recordScan`, `generateCards`). This is the only place that talks to the database; routes and components call these functions, never Drizzle directly. `listCards`, `updateCard`, `deactivateCard`, and `generateCards` are admin-only and carry the `requireAdmin` middleware; `getCard`, `activateCard`, and `recordScan` stay public since customers hit them from `/q/$code`.
- `src/server/adminSession.ts`, `src/server/adminMiddleware.ts`, `src/server/auth.functions.ts` — admin auth: signs/verifies the session cookie against `ADMIN_PASSWORD`, the `requireAdmin` middleware, and the `checkAdminSession`/`adminLogin`/`adminLogout` server functions used by `/admin` and `/admin/login`.
- `src/data/cards.ts` — `Card` type + demo/seed fixture data only. Not read by any route anymore; kept for local reference/demo purposes.
- `src/lib/qr.ts` — QR PNG/SVG generation (via `qrcode`) and blob/download helpers. QR options are fixed at high error correction, black-on-white, generous margin — do not change these without re-reading the product brief (printed cards must scan reliably). The QR always encodes `/q/<code>`, never the review URL, and is generated once at print time — activating a card never changes its QR.
- `src/lib/whatsapp.ts` — normalizes a stored phone number into a `wa.me` link.
- `src/components/PageShell.tsx`, `Wordmark.tsx` — shared minimal centered layout used by all customer-facing screens.
- `src/components/CardsTable.tsx`, `QrGenerator.tsx` — admin-only pieces used by `admin.tsx`. `QrGenerator` calls the `generateCards` server function to create `INACTIVE` rows in the database before rendering QR images for them (so bulk-printed QR always has a matching database row up front).

## Conventions

- Path alias `@/*` → `src/*`.
- Strict TypeScript; no unused locals/params. Use `import type { FormEvent, ReactNode } from 'react'` rather than the `React.X` namespace form (no default `React` import in scope under the `react-jsx` transform).
- Styling is deliberately plain per the product brief: `#f7f7f7` background, white cards, thin borders, 12–16px radius, black buttons, Inter font, no gradients/animation. Preserve this on any new customer-facing screen.
- Card/admin state is a database-backed source of truth (`cards`/`scans` tables) accessed only through `src/server/cards.functions.ts`. Any schema change requires updating `db/schema.ts` and generating a migration with `npx drizzle-kit generate --name <name>` (migrations land in `netlify/database/migrations/` — the folder name is legacy, it's just SQL files now). Apply migrations by running `npx drizzle-kit migrate` with `DATABASE_URL` set — nothing applies them automatically on deploy anymore, so run it yourself after every schema change that touches a real environment.
- Card `code` is immutable once created; edits and activation only ever touch `status`, `shop_name`, `review_url`, `whatsapp`, `activated_at`.

## Roadmap

Persistence (cards + scans tables, activation, admin CRUD, scan tracking, bulk QR generation writing to the database) is done. Admin authentication is done too (see `PLAN.md` Milestone 4) — set `ADMIN_PASSWORD` (and `DATABASE_URL`) as environment variables on whichever host you deploy to, or `/admin` will throw until they're set. Hosting is host-agnostic as of `PLAN.md` Milestone 7 (moved off Netlify-specific deploy/DB coupling). Remaining open items from `PLAN.md`: scan analytics (Milestone 5) and production hardening (Milestone 6).
