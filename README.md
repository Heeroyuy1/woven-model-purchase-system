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
| **Payments** | Stripe/PayPal (abstracted processor pattern) |
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
| `STRIPE_SECRET_KEY` | Stripe payment key | (empty = demo mode) |
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
- `POST /api/checkout/calculate` — price calculation
- `POST /api/checkout/place` — place order
- `GET /api/orders` — my orders
- `GET /api/licenses/user` — my licenses
- `GET/PUT /api/portal/profile` — profile management
- `POST /api/portal/support` — create support ticket

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

It registers (or logs in) the buyer, adds the product to the cart, places the order with simulated Stripe payment (`tok_visa`), and prints the order number, invoice, and license key. The system then emails the buyer:
1. **Order Confirmation**
2. **License Key Delivery** (with the real product name)
3. **Thank You / Onboarding**

Available product codes: `CONQUEST` ($499), `STRATUM` ($299), `WMAM` ($200), `PII` (free).

## Deployment (Railway)

- **Service:** `woven-model-purchase-system` (project `celebrated-courage`, environment `production`)
- **Builder:** Nixpacks
- **Health check:** `GET /api/health`
- **Start command:** `npx prisma generate && npx tsx src/index.ts` — **no `prisma db push`**, so deploys never wipe the shared database.
- The service hosts both the API and the built React storefront (served from `backend/public`).
- The database is a Railway-hosted PostgreSQL instance **shared with the Woven Model Licensing Platform**.

For deployment instructions runbooks and troubleshooting, see `RUNBOOK.md`.

## License

© 2026 Woven Model. All rights reserved.
