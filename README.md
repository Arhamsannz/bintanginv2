# BINTANGIN — Smart Review Card

Full-stack QR/NFC system for BINTANGIN cards. Each printed card keeps a permanent URL such as `/q/BGN0001`. The destination can be changed from the admin dashboard without reprinting the card.

## Stack

- TanStack Start + React
- Vite + Nitro production server
- Tailwind CSS
- Neon PostgreSQL + Drizzle ORM
- QR PNG/SVG + ZIP generation

## Railway deployment

This repository is configured for Railway's Docker builder.

### Required Railway Variables

```env
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=your-strong-admin-password
```

Railway supplies `PORT` automatically. The Nitro server listens on the Railway-provided port in production.

### Build and start

```bash
npm install
npm run build
npm run start
```

The production build is emitted to `.output/server/index.mjs`.

### Database

The application does not create database tables automatically. Apply the SQL migration in `netlify/database/migrations/` to the PostgreSQL database once before using the app. The `netlify/` directory name is retained only for migration history compatibility; the application is not coupled to Netlify.

## Routes

- `/` — landing page
- `/q/:code` — activation/rating flow
- `/admin/login` — admin login
- `/admin` — card management + QR generator

## Card flow

1. A generated code starts as `INACTIVE`.
2. Scanning `/q/<code>` shows activation when the card is inactive.
3. Activation stores the shop name, Google Review URL and/or WhatsApp number.
4. Future scans show the rating page.
5. 4–5 stars redirect to Google Review.
6. 1–3 stars open WhatsApp feedback.
7. Editing the card changes destinations without changing the printed QR URL.
