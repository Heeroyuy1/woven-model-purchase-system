# Woven Model — Product Purchase System

Production-ready commerce platform — from product discovery through payment, license generation, email delivery, and post-purchase support. Integrates directly with the [Woven Model Licensing Platform](https://woven-licensing-production.up.railway.app).

## Architecture

```
┌──────────────┐     HTTP      ┌──────────────────┐    API calls    ┌──────────────────────┐
│  Browser     │ ────────────▶ │  Express Server  │ ──────────────▶ │  Licensing Platform  │
│  (React SPA) │ ◀──────────── │  (Port 3001)     │ ◀────────────── │  (Railway)           │
│  Port 5173   │               │                  │                 │                      │
└──────────────┘               │  • Auth (JWT)     │                └──────────────────────┘
                               │  • Products       │
                               │  • Cart/Checkout  │    SMTP         ┌──────────────────────┐
                               │  • Orders         │ ──────────────▶ │  Gmail (ceo@...)     │
                               │  • Licenses       │                 │  sales@wovenmodel.com │
                               │  • Admin          │                 └──────────────────────┘
                               │  • Email          │
                               └──────────────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │  SQLite  │
                              │  dev.db  │
                              └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS 4, Zustand, React Router |
| **Backend** | Node.js, Express 4, TypeScript, Prisma 6 ORM |
| **Database** | SQLite (dev), PostgreSQL-ready (Prisma) |
| **Licensing** | FastAPI server on Railway (`woven-licensing-production.up.railway.app`) |
| **Email** | Nodemailer via Gmail SMTP (App Password) |
| **Payments** | Stripe/PayPal (abstracted processor pattern) |
| **Auth** | JWT (bcrypt, 7-day expiry) |

## Project Structure

```
Woven Model ProductPurchaseSystem/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── prisma/       # Schema + SQLite DB
│   │   ├── src/
│   │   │   ├── config/   # Environment config
│   │   │   ├── middleware/ # Auth, error handling, validation
│   │   │   ├── routes/   # 10 route modules
│   │   │   ├── services/ # Licensing, Email, Payment, Order, Coupon
│   │   │   ├── templates/ # HTML email templates
│   │   │   ├── validators/ # Zod schemas
│   │   │   ├── index.ts  # Entry point
│   │   │   └── seed.ts   # DB seeder
│   │   └── .env          # Configuration
│   ├── frontend/         # React SPA
│   │   └── src/
│   │       ├── pages/    # 17 pages
│   │       ├── services/ # API client
│   │       ├── store/    # Zustand stores
│   │       ├── components/ # Reusable components
│   │       └── styles/   # Global CSS
│   └── design-system/    # Brand tokens
├── RUNBOOK.md
├── PLAYBOOK.md
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# 1. Install dependencies (root workspace)
cd "Woven Model ProductPurchaseSystem"
npm install

# 2. Generate Prisma client + create DB
cd packages/backend
set DATABASE_URL=file:./dev.db
npx prisma generate
npx prisma db push

# 3. Seed database
npx tsx src/seed.ts

# 4. Start backend (port 3001)
npx tsx src/index.ts

# 5. Start frontend (separate terminal, port 5173)
cd packages/frontend
npm run dev
```

### Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@wovenmodel.com | K23HzAshHAZEPqyI4 |
| **Customer** | demo@wovenmodel.com | Demo123! |

### Coupon
`WELCOME10` — 10% off

## Configuration

All configuration is in `packages/backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite path | `file:./dev.db` |
| `JWT_SECRET` | Token signing secret | Must change in production |
| `LICENSING_API_URL` | Licensing server | `https://woven-licensing-production.up.railway.app/api/v1` |
| `LICENSING_API_KEY` | Licensing admin password | `K23HzAshHAZEPqyI4` |
| `STRIPE_SECRET_KEY` | Stripe payment key | (empty = demo mode) |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_USER` | SMTP login | `ceo@wovenmodel.com` |
| `SMTP_PASS` | App password | Gmail App Password |
| `SMTP_FROM` | From address | `ceo@wovenmodel.com` |
| `SMTP_REPLY_TO` | Reply-to address | `sales@wovenmodel.com` |
| `ADMIN_EMAIL` | For licensing auth | `admin@wovenmodel.com` |
| `ADMIN_PASSWORD` | For licensing auth | `K23HzAshHAZEPqyI4` |
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
- `GET/POST/PUT /api/admin/products` — manage products
- `GET /api/admin/customers` — list customers
- `GET/POST /api/admin/licenses` — manage licenses
- `GET /api/admin/reports/*` — sales/product/license reports
- `GET/POST/PUT/DELETE /api/admin/coupons` — coupon CRUD
- `GET /api/admin/email-logs` — email history

## License

© 2026 Woven Model. All rights reserved.
