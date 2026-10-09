# SvapNora

Official SvapNora website and the **GlowLang** developer platform, plus a
protected administrative dashboard for content, contact submissions and payment
records.

> **Honesty note.** Nothing in this repository fabricates company facts. Prices,
> testimonials, benchmarks, customer counts and similar claims are intentionally
> omitted or marked as “not yet published”. Payment records default to a
> clearly-labelled **demo** mode; no real transactions are created unless a real
> gateway is configured with valid credentials.

---

## Repository layout

npm workspaces monorepo:

```
.
├─ client/        React 18 + TypeScript + Vite + Tailwind (public site + admin SPA)
├─ server/        Express + TypeScript + Prisma/PostgreSQL API
├─ docker-compose.yml   local PostgreSQL
└─ .env.example   canonical environment variables
```

## Prerequisites

- Node.js >= 20 (tested on 24.x)
- PostgreSQL 16 (or Docker to run the bundled one)

## Quick start

```bash
# 1. Install dependencies (root installs all workspaces)
npm install

# 2. Configure environment
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
#   then edit .env — at minimum set SESSION_SECRET to a long random string:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Start PostgreSQL
docker compose up -d

# 4. Generate the Prisma client, apply the schema and seed starter content
npm run db:generate
npm run db:deploy               # applies server/prisma/migrations to the database
npm run db:seed

# 5. Create the first administrator
npm run admin:create            # uses ADMIN_* values from .env

# 6. Run the dev servers (API :4000, web :5173)
npm run dev
```

Open http://localhost:5173 for the public site and http://localhost:5173/admin
for the dashboard.

## Available scripts (repository root)

| Script | Description |
| --- | --- |
| `npm run dev` | Run API + client concurrently |
| `npm run build` | Type-check and build both workspaces |
| `npm run typecheck` | TypeScript project checks (no emit) |
| `npm run lint` | ESLint for both workspaces |
| `npm test` | Server unit/security tests (Vitest) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed starter content (idempotent upserts) |
| `npm run admin:create` | Provision/update an administrator |

## Environment variables

See `.env.example` for the full, commented list. Highlights:

- `DATABASE_URL` — PostgreSQL connection string.
- `SESSION_SECRET` — HMAC key for session-token hashing (>= 32 chars in prod).
- `CORS_ORIGINS` / `APP_ORIGIN` — browser origin allow-list.
- `ADMIN_*` — used only by `admin:create`.
- `EMAIL_PROVIDER` — `none` (store only) or `smtp`.
- `PAYMENT_PROVIDER` — `none` (demo), `stripe`, or `razorpay`.

## Architecture

### Backend (`server/`)

- **Express 4 + TypeScript**, Zod-validated input, pino logging, helmet,
  compression, rate limiting.
- **Auth**: opaque session tokens in an HTTP-only cookie; only an HMAC-SHA256
  hash of the token is stored (`AdminSession.tokenHash`). Passwords are hashed
  with **Argon2id**.
- **CSRF**: double-submit cookie (`svapnora_csrf`) plus `X-CSRF-Token` header,
  enforced on all `/api/admin` mutations.
- **RBAC**: `OWNER / ADMIN / EDITOR / VIEWER` with a permission matrix mirrored
  on client and server (`server/src/lib/permissions.ts`).
- **Auditing**: privileged actions append to `AdminAuditLog`.
- **Money**: stored as integer minor units (`BigInt`); serialized to strings in
  API responses. See `server/src/lib/money.ts`.
- **Webhooks**: raw-body route mounted before `express.json`, with Stripe and
  Razorpay signature verification and idempotent event storage.

### Frontend (`client/`)

- **React 18 + Vite + React Router 6**, dark-first CSS-variable design system
  (`src/index.css`), Tailwind, Lenis smooth scrolling, framer-motion.
- A dependency-free **GlowLang syntax highlighter** (`src/lib/highlight.ts`).
- Lazy-loaded routes; the admin SPA is served under `/admin`.

### Payments (demo mode by default)

With `PAYMENT_PROVIDER=none` the payments module is fully functional for
demonstration: records are created with `provider: "demo"` and a visible demo
banner. Webhook verification code paths exist for Stripe and Razorpay but only
run when those providers are configured with real secrets.

## Going live (free tier)

The recommended zero-cost stack is **Render (web) + Supabase (Postgres) +
Brevo (email)**. A `render.yaml` Blueprint is included.

### 1. Push the code to GitHub

Render deploys from a Git repository. Create an empty repository on GitHub, then
from the project root:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.env` is git-ignored — never commit secrets.

### 2. Create the free Supabase database

1. Create a project at <https://supabase.com> (free, no card).
2. Project Settings → Database → **Connection pooling** → copy the URI.
3. Use the pooled URI (host ends in `pooler.supabase.com`, port `6543`) and append
   `?pgbouncer=true` — e.g.
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public`.

### 3. Deploy on Render

1. Render Dashboard → **New → Blueprint** → select your repository → **Apply**.
2. When prompted, paste the Supabase URL into `DATABASE_URL`. Set `ADMIN_EMAIL`,
   `ADMIN_PASSWORD` (and optional `CONTACT_TO_EMAIL`).
3. The build runs `db:generate` + `build`; the start command applies migrations
   (`db:deploy`) and boots the server, which also serves the built client.
4. Open the service URL. If Render appended a suffix to the name, update
   `APP_ORIGIN`, `API_ORIGIN` and `CORS_ORIGINS` (in the dashboard) to the real
   `https://…onrender.com` URL and redeploy.

### 4. Create the first administrator

Run once against the production database (locally, using the Supabase URL in
`.env`, or from the Render Shell):

```bash
npm run admin:create
```

Then sign in at `/admin` with the `ADMIN_*` credentials.

### 5. Enable real email (optional, Brevo)

1. Create a free Brevo account and verify a sender/domain.
2. Set these Render env vars and redeploy:

   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<brevo login>
   SMTP_PASS=<brevo smtp key>
   EMAIL_FROM=SvapNora <no-reply@yourdomain.com>
   CONTACT_TO_EMAIL=you@yourdomain.com
   ```

### Custom domain

Add the domain in Render (Settings → Custom Domains), point your registrar's DNS
at Render, then set `APP_ORIGIN` / `API_ORIGIN` / `CORS_ORIGINS` to
`https://yourdomain.com` and redeploy. `robots.txt` and `sitemap.xml` are
generated from `APP_ORIGIN`; submit the sitemap in Google Search Console.

> Render's free web service sleeps after ~15 minutes of inactivity and wakes on
> the next request (a short cold start). Free Render Postgres expires after 30
> days — which is why this project uses Supabase for the database instead.

## Testing

```bash
npm test        # server tests (money, permissions, payments, security)
```

The security suite exercises authentication and CSRF boundaries without
requiring a database.

## Known limitations

- Payments are **demo-only** until a real gateway and credentials are supplied.
- No published pricing — `/pricing` states this explicitly rather than inventing
  numbers.
- Email delivery is disabled by default (`EMAIL_PROVIDER=none`); submissions are
  still stored and visible in the admin dashboard.
- The bundled `docker-compose.yml` database is for local development only.
