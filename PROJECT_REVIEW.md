# Woven Model Product Purchase System — Project Review

Comprehensive analysis of the existing Woven Model Product Purchase System, compiled from the actual project source. The implementation was treated as the source of truth; where documentation conflicts with code, the code wins.

_Last updated: August 13, 2026_

---

## 1. Project Overview

The Woven Model Product Purchase System is a full-stack **e-commerce / digital-goods commerce platform** for selling Woven Model software products. It implements a complete sales lifecycle: product discovery → cart → checkout → (simulated) payment → order creation → license generation via the external Woven Model Licensing Platform → email delivery (confirmation, license key, thank-you) → customer portal with orders/licenses/profile → admin dashboard (products, orders, customers, licenses, coupons, reports).

It is **not** a traditional purchasing/requisition system (no purchase requests, vendors, approvals, receiving, or budgets). The name "Purchasing System" refers to the **sale/purchase of Woven Model's own software products**.

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19, TypeScript, Vite 6, TailwindCSS 3.4, Zustand 5, React Router 7, lucide-react, react-hot-toast | `@stripe/react-stripe-js` installed but unused |
| Backend | Node.js, Express 4, TypeScript, Prisma 6 ORM, bcryptjs, jsonwebtoken, helmet, express-rate-limit, zod, stripe | Nodemailer used for SMTP2GO email delivery |
| Database | PostgreSQL (Prisma schema, `purchase_` table prefix) | README/RUNBOOK mention SQLite dev DB — schema is authoritative |
| Licensing | External FastAPI server on Railway (`woven-licensing-production.up.railway.app`) consumed via REST client | |
| Email | SMTP2GO (SMTP relay via `mail.smtp2go.com:2525`, STARTTLS) | Previously Mailjet REST (hardcoded credentials removed) |
| Payments | Stripe (real when `STRIPE_SECRET_KEY` set; otherwise simulated) and PayPal (stub — always simulated success) | |
| Auth | JWT (7-day expiry), bcrypt (12 rounds), roles (`customer`/`admin`/`super_admin`) | |

## 3. Project Structure

```
Woven Model ProductPurchaseSystem/
├── README.md / PLAYBOOK.md / RUNBOOK.md / PROJECT_REVIEW.md
├── package.json                       # Root workspace (design-system, backend, frontend)
├── *.html, *.png                      # Marketing-site static assets
└── packages/
    ├── backend/                       # Express API + serves built SPA
    │   ├── src/index.ts               # Entry: helmet, CORS, rate limit, /api/health, routes, static SPA, catch-all
    │   ├── src/config/env.ts          # Environment getters with defaults
    │   ├── src/middleware/            # auth, errorHandler, validate (Zod)
    │   ├── src/routes/                # auth, products, cart, checkout, orders, licenses, admin, portal, coupons, seed
    │   ├── src/services/              # coupon, email (SMTP2GO), licensing, order, payment
    │   ├── src/templates/             # HTML email builders (order confirmation, license delivery, thank you)
    │   ├── src/validators/            # Zod schemas
    │   └── prisma/schema.prisma       # 18 models
    ├── frontend/                      # React SPA (Vite)
    │   ├── src/pages/                 # 20 pages (store, auth, portal, admin)
    │   ├── src/components/layout/     # Layout, Navbar, Footer
    │   ├── src/services/              # api.ts (fetch wrapper), licensingApi.ts (endpoint functions)
    │   ├── src/store/                 # authStore.ts, cartStore.ts (Zustand)
    │   └── src/styles/global.css      # Tailwind + glass-card / input-dark component classes
    └── design-system/                 # Brand tokens only (tokens/index.ts)
```

**Empty directories confirmed:** `frontend/src/components/{admin,cart,checkout,portal,storefront,ui}`, `frontend/src/hooks`, `design-system/components`, `design-system/icons`, `backend/src/types`, `backend/src/utils`.

## 4. Architecture

Monorepo workspace (npm) with three packages. Layers:

- **Frontend (React SPA, port 5173 dev):** pages → Zustand stores + `licensingApi.ts` → `api.ts` fetch wrapper (`/api` base) → backend. Route guards: `ProtectedRoute` (logged-in), `AdminRoute` (role admin), `GuestRoute`.
- **Backend (Express, port 3001):** `index.ts` registers security middleware (helmet, CORS allowlist, rate limit 200/min), `/api/health`, 10 route modules, then serves the built SPA from `backend/public` with an `app.get('*')` catch-all.
- **Service layer:** `orderService.processOrder()` orchestrates payment → payment record → invoice → per-item licenses via licensing API → fire-and-forget emails → notification → order `completed`; `OrderEvent` rows at each step.
- **Database layer:** Prisma client, used directly in routes/services (no repository layer).
- **External integrations:** Licensing platform (REST, token auth, 55-min token cache, retries), SMTP2GO via Nodemailer, Stripe (optional).
- **Auth layer:** JWT Bearer; `requireAuth` re-loads the user and checks `isActive`; `requireAdmin` allows `admin`/`super_admin`.

Customer purchase data flow: `CheckoutPage` → `POST /api/checkout/place` → order + items created, cart cleared → `processOrder` → payment → `confirmed` → invoice → licenses (with `PENDING-*` local fallback if the licensing API is down) → 3 emails → notification → `completed`.

## 5. Railway / Deployment Architecture

- **Railway configuration:** `packages/backend/railway.json` — project `celebrated-courage`, environment `production`, service `woven-model-purchase-system`. Nixpacks builder; start command `npx prisma generate && npx prisma db push --accept-data-loss && npx tsx src/index.ts`; health check `/api/health`; restart on failure. Matching `Procfile` exists.
- **Single service:** Railway hosts the backend, which serves the built React SPA — API and storefront live in one service.
- **Database:** hosted on Railway — `prisma db push` applies the PostgreSQL schema at boot. The local SQLite references in docs are inconsistent with the committed Prisma schema.
- **Environment variables:** set in the Railway dashboard (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `LICENSING_API_URL`, `LICENSING_API_KEY`, `STRIPE_SECRET_KEY`, `SMTP_*`, `FRONTEND_URL`, `CORS_ORIGINS`, `TAX_RATE`, `ADMIN_*`). `.env.example` documents these.
- **Licensing platform** is a separately hosted application; deployment details and account relationship with this project could not be confirmed from this repo.
- Deployment trigger (automatic GitHub connection vs manual) — not confirmable from the repo. Git remote: `github.com/Heeroyuy1/woven-model-purchase-system`.

## 6. Purchasing Workflow (as implemented)

1. Browse/discover — public product catalog with category + search.
2. Account — register or login (JWT). No email verification flow despite an `emailVerified` field.
3. Cart — authenticated, server-persisted per customer (add/merge quantity, remove, clear).
4. Checkout — 3-step UI (customer info → billing address → payment method). Payment token is hardcoded `tok_visa`; Stripe Elements fields are placeholders.
5. Order placement — creates order + items, clears cart, then `processOrder()`:
   - Payment (Stripe real/simulated; PayPal simulated) → on failure order is `cancelled`.
   - Order → `confirmed`; invoice created (`INV-<orderNumber>`, `paid`).
   - Per-item license via licensing API (perpetual for perpetual/enterprise/developer; else 365-day); `PENDING-*` local license on failure.
   - Emails fire-and-forget (confirmation, license delivery, thank-you).
   - `order_completed` notification; order status → `completed`.
6. Customer post-purchase — portal dashboard, orders (expandable license keys), licenses (copy-to-clipboard), profile (edit fields, change password).
7. Cancellation — only while `pending`.

The workflow **stops after license delivery + email**. No approval workflow, vendors, quotes, receiving, or invoice/payment reconciliation cycles.

## 7. Data Flow

- **Origination:** customer interactions on the React SPA; all state changes through the Express API.
- **Storage:** PostgreSQL via Prisma (18 models, `purchase_` prefix).
- **Relations:** `Customer` 1→N `Order/CartItem/License/Subscription/ProductReview/SupportRequest/Notification/AuditLog`; `Order` 1→N `OrderItem/Invoice/Payment/License/OrderEvent`; `License` 1→1 `Subscription`; `AuditLog` N→1 `Customer`.
- **Status changes:** `Order` transitions write `OrderEvent` rows; `License` status set at creation or admin revoke. The global `AuditLog` model is never written.
- **External:** licensing API (license generation), SMTP2GO (emails), Stripe (optional payments).
- **Deployed:** browser → Railway-hosted Express (same-origin `/api`) → Railway PostgreSQL; Express → licensing platform + SMTP2GO + Stripe.

## 8. Existing Features (verified)

- **Storefront:** catalog (list/detail/category/search), featured products, cart, 3-step checkout, order confirmation.
- **Auth:** register, login, `/me`, profile update, change password, JWT middleware, optional auth.
- **Orders:** user list/detail/cancel; admin list (status/search/date filters, pagination), status updates, detail modal (items/payments/licenses/events).
- **Products (admin):** list, create, update (JSON-encoded features/platformSupport), soft-delete.
- **Customers (admin):** list with search + pagination, counts, expandable detail.
- **Licenses (admin):** list, generate (licensing API), revoke (local DB only).
- **Coupons (admin):** full CRUD; validation (active/expiry/max-uses/min-order, percentage/fixed).
- **Reports (admin):** sales (daily/monthly, revenue/orders/AOV, bar chart), products (revenue/units/orders), licenses (total/status/type/last-30-days).
- **Email:** 3 branded HTML templates; SMTP2GO delivery; `EmailLog` table; admin email-logs endpoint.
- **Portal:** dashboard, orders, licenses, profile. Backend portal endpoints (downloads/notifications/support) exist but the frontend does not call them.
- **Health:** `GET /api/health`. **Seed:** admin + demo user, 5 products, `WELCOME10`, 3 email templates.

## 9. Feature Completion Matrix

| Feature | Status | Evidence / Notes |
| ------- | ------ | ---------------- |
| Purchase Requests | **Not Present** | No request/requisition model or UI. Direct cart→order flow. |
| Purchase Orders | **Partially Complete** | `Order`/`OrderItem` with lifecycle + events; no vendor, quote, receiving, fulfillment. |
| Vendors | **Not Present** | No vendor model or UI. |
| Approvals | **Not Present** | No approval workflow; admin changes order status directly. |
| Receiving | **Not Present** | No receiving model/UI. |
| Invoices | **Partially Complete** | Auto-created `paid` invoice at order processing; no invoice UI or payment flow. |
| Budgets / Departments / Cost Centers / Employees / Requesters / Approvers | **Not Present** | None in schema or code. |
| Reporting | **Partially Complete** | Sales/products/licenses implemented; no export or date-range UI for product/license reports. |
| Search | **Partially Complete** | Product search; admin order/customer search. No other entities searchable. |
| Audit History | **Partially Complete** | `OrderEvent` timeline; global `AuditLog` model never written. |
| Attachments / Documents / Notes | **Not Present** | No upload/attachment; `Download` model never queried; portal downloads synthesize hardcoded URLs. |
| Licensing (integration) | **Partially Complete** | License generation integrated; local `License` mirror + `PENDING-` fallback; no validation/activation/expiry-check/trial flow here; local-only revoke; `licensingUserId` never set (falls back to 1). |
| Authentication | **Complete** (core) | Register/login/JWT/roles. No email verification flow, no password reset, no MFA. |
| Integrations | See §14 | Licensing (implemented), SMTP2GO email (implemented), Stripe (partial), PayPal (stub). |
| Trials | **Partially Complete** | `trialAvailable`/`trialDays` fields + UI badge; no trial license creation. |
| Subscriptions | **Stub / Placeholder** | Model exists; nothing creates/manages them. |
| Reviews | **Stub / Placeholder** | Model exists; no UI or routes. |
| Support Tickets | **Backend only** | `POST /api/portal/support` exists; no frontend UI. |
| Notifications | **Partially Complete** | `order_completed` created at completion; portal endpoints unwired from frontend. |

## 10. Database

- **Technology:** PostgreSQL (Prisma `provider = "postgresql"`). No committed migrations — schema applied via `prisma db push` (including on Railway with `--accept-data-loss`).
- **Models (18):** Customer, Product, CartItem, Order, OrderItem, Invoice, Payment, License, Subscription, Coupon, OrderEvent, ProductReview, SupportRequest, EmailTemplate, EmailLog, Notification, AuditLog, Download — all `@@map("purchase_*")`.
- **Keys:** UUID PKs; unique on email, product code, order number, invoice number, license key, coupon code, `CartItem(customerId, productId)`, `ProductReview(customerId, productId)`, `Subscription.licenseId`.
- **JSON-as-string storage:** many Product fields stored as JSON strings, parsed inconsistently across public vs admin routes.
- **Unused schema:** `AuditLog` (never written), `Download` (never queried), `EmailTemplate` (seeded but email service uses TS template modules), `Subscription`/`ProductReview` (no code paths).
- **Seeding:** `src/seed.ts` + exposed `POST /api/seed` route guarded by a default key (`seed-me` — `SEED_KEY` env not implemented in `config/env.ts`). It reseeds the admin password from code.

## 11. Security

- **Present:** helmet (CSP/COEP disabled), CORS allowlist, global rate limit (200 req/min), Zod validation on auth/checkout, bcrypt(12), JWT expiry 7d, `requireAuth` re-validates user + `isActive`, admin role gate, API client clears token on 401, structured Prisma/JWT error mapping.
- **Findings (no changes made beyond the email work):**
  - Default `JWT_SECRET` = `change-me` if env unset.
  - `POST /api/seed` accepts a default key and reseeds admin from code.
  - Unknown `/api/*` paths return the SPA HTML with HTTP 200 (catch-all masks broken API calls).
  - Several admin routes accept unvalidated request bodies.
  - No lockout, password reset, email verification, or MFA.
  - `NODE_ENV` must be set to `production` explicitly to avoid stack traces in errors.

## 12. Licensing

The Purchasing System is a **consumer** of the external Woven Model Licensing Platform:
- `licensingService.ts` implements a client with token auth (login, 55-min cached token, 401 re-auth, 2 retries). Only `generateLicense` is used; `createCustomer` is never called (so licensing users are never created/synced; `userId` falls back to 1).
- Local `License` model mirrors server licenses (`licensingLicenseId`), stores key/type/status/activations/expiry/perpetual; `PENDING-*` placeholders when the API is unreachable.
- No validation, activation, deactivation, trial, or offline behavior lives in this project — those are on the licensing platform.

## 13. UI / UX

- **Design language:** consistent Woven Model branding — dark navy (`#0a0f1e` family), cyan accents (`#22d3ee`), glassmorphism (`backdrop-blur`, translucent cards, `glass-card`), Inter font, white/10 borders, chunky shadows.
- **Pages/nav:** fixed glass navbar (cart badge, profile dropdown with admin submenu), mobile drawer, footer; dashboard stat cards; portal pages; admin tables with modals and status badges.
- **Design system package:** tokens only; components/ and icons/ empty. The frontend duplicates tokens via Tailwind config rather than importing the package.
- **UI defects:** `hover:shadow-glow` has no matching Tailwind shadow definition; admin product status uses `product.status` while the backend returns `active`; AdminCustomersPage detail shows unrelated data (see §18); checkout shows a hardcoded 8% tax while backend `TAX_RATE` defaults to 0.

## 14. Integrations

| Integration | Status | Evidence |
| ----------- | ------ | -------- |
| Woven Model Licensing Platform | **Fully implemented (generation)** | `licensingService.ts` used in order service and admin generate. |
| SMTP2GO (email) | **Implemented** | `emailService.ts` via Nodemailer; `EmailLog` retention. |
| Stripe | **Partially implemented** | Real when key set; otherwise simulated; frontend sends hardcoded `tok_visa`; Elements UI placeholder-only. |
| PayPal | **Stub** | Always simulated success; no SDK. |
| Microsoft Entra / Graph / 365 / SharePoint / Outlook / Teams / Power Automate / ERP / accounting | **Not Present** | No evidence in code or config. |
| GitHub Pages (marketing site) | **Configured but unverifiable** | `.env.example` references `heeroyuy1.github.io`; static marketing HTML committed. |

## 15. Logging / Audit

- **Logging:** backend stdout (startup banner, licensing retry warnings, seed output, email results); global error handler logs every error; `uncaughtException` exits.
- **Email logs:** `EmailLog` table records every send (to/subject/template/status/error/orderId); admin endpoint returns last 100.
- **Order audit:** `OrderEvent` rows for created/paid/license_generated/email_sent/completed/cancelled/payment_failed and admin status changes.
- **Unused:** global `AuditLog` model.
- **Railway logs:** exist by platform default; nothing in the repo reads them.

## 16. Testing

**No automated tests exist.** No test directories/files, no Jest/Vitest/Cypress/Playwright, no test scripts. The only verification is manual curl/health checks documented in the RUNBOOK.

## 17. Current Development Progress

The system is **largely built and feature-complete for a v1 commerce product**, with an end-to-end customer path and substantial admin tooling. It appears to be in late-stage / launch-preparation (Railway config, Procfile, built SPA committed, PLAYBOOK launch checklist).

**Confirmed gaps (from code):**
1. **Frontend/backend API contract mismatches (broken features):**
   - `getUserLicenses()` → `/api/licenses/user` — no such backend route → **My Licenses page and dashboard license count fail**.
   - `updateProfile()` → `PUT /profile`, `changePassword()` → `POST /profile/change-password` — backend is `/api/auth/profile` and `/api/auth/change-password` → **profile save/password change fail**.
   - `getDownloads()`, `getNotifications()`, `markNotificationRead()`, `createSupportRequest()` — backend paths are `/api/portal/*` → **unwired**.
   - `adminRevokeLicense()` → `POST /admin/licenses/:id/revoke` — backend is `PUT` → **admin revoke fails**.
   - AdminCustomersPage detail uses `adminGetOrders({customerId})` (ignored by backend) and `getLicenses()` (admin's own licenses) → **unrelated data**.
   - Admin generate-license modal sends `{productId, customerEmail}` — backend expects `{productCode, customerId}` → **manual license generation fails at product lookup**.
   - Admin order modal calls `getOrder()` which is customer-scoped → **admin cannot view another customer's order detail**.
   - Checkout coupon reads `res.discountPercent/discountAmount` — backend returns `{valid, discount, ...}` → **discount never displayed** (still applied at placement).
2. **Email bug:** `orderService` passes `licenseType` as the product name in license-delivery emails.
3. **Payment:** always simulated from the UI (`tok_visa`); no real card entry.
4. **Trials, subscriptions, reviews, audit, support, downloads, notifications** — models/fields exist but are unpopulated or unwired.
5. Docs vs implementation inconsistencies (SQLite docs vs PostgreSQL schema; SendGrid/Gmail mentions vs SMTP2GO).

## 18. Facts / Observations

1. The project name describes selling Woven Model software, not a B2B requisition/purchasing system.
2. Workspace packages: `backend`, `frontend`, `design-system`; root scripts run dev/build for all.
3. `railway.json` + `Procfile` run `prisma db push --accept-data-loss` at every start.
4. `app.get('*')` catch-all returns the SPA for unknown paths, including unknown `/api/*`.
5. SMTP2GO DNS quirk: Node's c-ares resolver (`dns.resolve4`) returns `EFORMERR` for `mail.smtp2go.com` (malformed additional TXT record in the DNS response). The email service resolves the host with `dns.lookup` (OS resolver) and connects to the IP with `tls.servername` to keep SNI correct. Confirmed working: SMTP2GO accepted test emails (250 OK) to ceo@wovenmodel.com.
6. Hardcoded default admin credentials, licensing API key, and SMTP app password appear in plaintext in docs/.env files. Values intentionally not reproduced here.
7. `WELCOME10` coupon seeds with `maxUses: 100`; `usedCount` is never incremented on redemption.
8. `checkout/place` silently ignores invalid coupons; the frontend never calls `/checkout/calculate`.
9. Cart decrement can push quantity to 0 or below (no lower-bound guard).
10. `frontend/public` and `backend/public` contain copies of the marketing site and brand PNGs; the SPA favicon `/vite.svg` is referenced but absent.
11. `design-system` package builds but is not imported by the frontend; components/icons empty.
12. No CI, no tests, no migrations directory, no Dockerfile — deployment relies on Nixpacks + `prisma db push`.
13. Orders still complete even when license generation fails — by design, to avoid blocking purchases.
