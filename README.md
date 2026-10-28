# Woven Model — Product Purchase System

Production-ready commerce platform — from product discovery through payment, license generation, email delivery, and post-purchase support. Integrates directly with the [Woven Model Licensing Platform](https://woven-licensing-production.up.railway.app).

## Architecture

```
┌──────────────┐     HTTP      ┌──────────────────┐    API calls    ┌──────────────────────┐
│  Browser     │ ────────────▶ │  Express Server  │ ──────────────▶ │  Licensing Platform  │
│  (React SPA) │ ◀──────────── │  (Railway)       │ ◀────────────── │  (Railway)           │
│              │               │                  │                 │                      │
└──────────────┘               │  • Auth (JWT)     │                └──────────────────────┘
                               │  • Products       │
                               │  • Cart/Checkout  │    SMTP2GO      ┌──────────────────────┐
                               │  • Orders         │ ──────────────▶ │  SMTP relay          │
                               │  • Licenses       │                 │  (mail.smtp2go.com)  │
                               │  • Admin          │                 └──────────────────────┘
                               │  • Backups        │
                               └──────────────────┘
                                    │
                                    ▼
                              ┌──────────────┐
                              │  PostgreSQL  │
                              │  (Railway)   │
                              └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS 4, Zustand, React Router |
| **Backend** | Node.js, Express 4, TypeScript, Prisma 6 ORM |
| **Database** | PostgreSQL on Railway (Prisma; single shared instance with the licensing platform) |
| **Licensing** | FastAPI server on Railway (`woven-licensing-production.up.railway.app`) |
| **Email** | SMTP2GO via Nodemailer — probes reachable IP:port at startup (`mail.smtp2go.com`, ports 2525/587/465/8025) |
| **Payments** | Stripe — PaymentIntents + Stripe Elements, 3-D Secure / SCA, signature-verified webhooks |
| **Auth** | JWT (bcrypt, 7-day expiry) |

## Project Structure

```
Woven Model ProductPurchaseSystem/
├── playbook.md        # Business operating playbook
├── runbook.md         # Operations / troubleshooting guide
├── project-review.md  # Architecture review
├── test-purchase.ts   # End-to-end purchase test script
└── packages/
    ├── backend/       # Express API server
    │   ├── prisma/    # Prisma schema (PostgreSQL)
    │   ├── src/
    │   │   ├── config/     # Environment config
    │   │   ├── middleware/ # Auth, error handling, validation
    │   │   ├── routes/     # 11 route modules (incl. backup)
    │   │   ├── services/   # Licensing, Email, Payment, Order, Coupon, Backup
    │   │   ├── templates/  # HTML email templates
    │   │   ├── validators/ # Zod schemas
    │   │   ├── index.ts    # Entry point
    │   │   └── seed.ts     # DB seeder
    │   ├── Procfile        # Railway start command (no `prisma db push`)
    │   ├── railway.json    # Railway service config (no `prisma db push`)
    │   └── .env            # Local configuration (not committed)
    ├── frontend/      # React SPA
    │   └── src/
    │       ├── pages/      # 20 pages
    │       ├── services/   # API client
    │       ├── store/      # Zustand stores
    │       ├── components/ # Reusable components
    │       └── styles/     # Global CSS (Woven Model design system)
    └── design-system/ # Brand tokens
```

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# 1. Install dependencies (root workspace)
cd "Woven Model ProductPurchaseSystem"
npm install

# 2. Generate Prisma client
cd packages/backend
npx prisma generate

# 3. Configure environment
copy .env.example .env
# edit .env → set DATABASE_URL, JWT_SECRET, SMTP_*, LICENSING_API_URL, ADMIN_*

# 4. Create + seed the (local) database
npx prisma db push
npx tsx src/seed.ts

# 5. Start backend
npx tsx src/index.ts

# 6. Start frontend (separate terminal)
cd packages/frontend
npm run dev
```

> **Note:** On Railway the schema is managed manually — the start command does **not** run `prisma db push`, so a deploy can never drop columns/tables. Apply schema changes explicitly (e.g. `railway run npx prisma db push`) when you actually intend to change the database.

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@wovenmodel.com | (set via `ADMIN_PASSWORD` env) |
| **Customer** | demo@wovenmodel.com | Demo123! |

### Coupon
`WELCOME10` — 10% off (seed data)

## Configuration

All configuration is via environment variables (`packages/backend/.env` locally; Railway dashboard in production):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (Railway sets) |
| `JWT_SECRET` | Token signing secret | Must change in production |
| `LICENSING_API_URL` | Licensing server | `https://woven-licensing-production.up.railway.app/api/v1` |
| `LICENSING_API_KEY` | Licensing API key / admin password | `K23HzAshHAZEPqyI4` |
| `STRIPE_SECRET_KEY` | Stripe secret key — its prefix (`sk_live_` / `sk_test_`) sets the payment mode | required for payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key — must match the secret key's mode or the server refuses to boot | required for payments |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhooks/stripe` | required in live mode |
| `PURCHASE_NOTIFICATION_EMAIL` | Internal "New Sale" email recipient | `ceo@wovenmodel.com` |
| `SMTP_HOST` | SMTP2GO host | `mail.smtp2go.com` |
| `SMTP_PORT` | SMTP2GO port | `2525` |
| `SMTP_USER` | SMTP2GO username | `wovenmodel.com` |
| `SMTP_PASS` | SMTP2GO password | — |
| `SMTP_FROM` | From address | `ceo@wovenmodel.com` |
| `SMTP_REPLY_TO` | Reply-to address | `sales@wovenmodel.com` |
| `ADMIN_EMAIL` | For licensing auth | `admin@wovenmodel.com` |
| `ADMIN_PASSWORD` | For licensing auth | — |
| `BACKUP_EMAIL` | Database backup recipient | `ceo@wovenmodel.com` |
| `TAX_RATE` | Tax decimal | 0.0 |

## API Endpoints

### Public
- `GET /api/products` — list active products
- `GET /api/products/:id` — product details
- `POST /api/auth/login` — sign in
- `POST /api/auth/register` — create account

### Protected (auth required)
- `GET/POST/DELETE /api/cart` — cart management
- `POST /api/checkout/calculate` — authoritative cart totals (subtotal, discount, tax, total)
- `POST /api/checkout/create-payment-intent` — snapshot the cart into a pending order and open a Stripe PaymentIntent
- `POST /api/checkout/place` — verify the PaymentIntent with Stripe, then fulfil the order

- `GET /api/orders` — my orders
- `GET /api/licenses/user` — my licenses
- `GET/PUT /api/portal/profile` — profile management
- `POST /api/portal/support` — create support ticket

### Public config / webhooks
- `GET /api/checkout/config` — `{ stripeMode, stripeEnabled, publishableKey }` (no auth)
- `POST /api/webhooks/stripe` — Stripe event destination; signature-verified, raw body, mounted before the JSON parser

### Admin (admin role required)
- `GET /api/admin/stats` — dashboard stats
- `GET/PUT /api/admin/orders` — manage all orders
- `GET/POST/PUT /api/admin/products` — manage products (incl. deactivate)
- `GET /api/admin/customers` — list customers
- `GET/POST /api/admin/licenses` — manage licenses
- `GET /api/admin/reports/*` — sales/product/license reports
- `GET/POST/PUT/DELETE /api/admin/coupons` — coupon CRUD
- `GET /api/admin/email-logs` — email history
- `POST /api/admin/backup` — generate + email a database backup immediately

## Automated Database Backups

The system emails a full database backup (all tables → gzipped JSON) to `BACKUP_EMAIL` (default `ceo@wovenmodel.com`):

- **Daily** (24h interval, first run 60s after server start)
- **On every deploy/boot** (60s after startup)
- **On demand** — `POST /api/admin/backup` (admin auth required)

Backups are read-only Prisma queries; the backup process never modifies the database. Filenames look like `woven-model-purchase-backup-2026-08-14T12-31-24-282Z.json.gz`.

## Testing the Full Purchase Flow

An end-to-end test script is checked into the repo root:

```bash
cd "Woven Model ProductPurchaseSystem"
npx tsx test-purchase.ts judewow@gmail.com        # buys CONQUEST (default) for that buyer
npx tsx test-purchase.ts someone@example.com PII  # buys a different product
```

It registers (or logs in) the buyer, adds the product to the cart, creates a **real Stripe PaymentIntent** for the total, confirms it, calls `/api/checkout/place` (which re-verifies the payment with Stripe), and prints the order number, invoice, and license key.

Card handling:
- With an `sk_test_` key the script confirms using Stripe's `pm_card_visa` test card, so the whole flow runs unattended.
- With an `sk_live_` key it **never charges a card**: it creates the PaymentIntent, stops, and prints the command to finish once the payment has been made in the browser.

The system then emails the buyer:
1. **Order Confirmation**
2. **License Key Delivery** (with the real product name)
3. **Thank You / Onboarding**

and sends `PURCHASE_NOTIFICATION_EMAIL` (default `ceo@wovenmodel.com`) an internal **New Sale** notice containing items, totals, PaymentIntent id, Stripe receipt link, and the issued license keys.

Available product codes: `CONQUEST` ($499), `STRATUM` ($299), `WMAM` ($200), `PII` (free).

## Deployment (Railway)

- **Service:** `woven-model-purchase-system` (project `celebrated-courage`, environment `production`)
- **Builder:** Nixpacks
- **Health check:** `GET /api/health`
- **Start command:** `npx prisma generate && npx tsx src/index.ts` — **no `prisma db push`**, so deploys never wipe the shared database.
- The service hosts both the API and the built React storefront (served from `backend/public`).
- **The Railway build does not build the frontend.** `backend/public` holds a committed bundle, so after any change under `packages/frontend` run `npm run build:public` (Vite build + `scripts/sync-public.cjs`) and commit the output — otherwise production keeps serving the previous bundle.
- Stripe keys must both come from the same mode (`sk_live_` + `pk_live_`); the server exits at boot if they disagree.
- Webhook endpoint to register in Stripe: `https://woven-model-purchase-system-production.up.railway.app/api/webhooks/stripe` with the four payment/refund/dispute events.
- The database is a Railway-hosted PostgreSQL instance **shared with the Woven Model Licensing Platform**.

For deployment instructions runbooks and troubleshooting, see `RUNBOOK.md`.

## License

© 2026 Woven Model. All rights reserved.
