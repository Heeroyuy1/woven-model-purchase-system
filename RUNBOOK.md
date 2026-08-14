# Woven Model Product Purchase System — Runbook

## Operational guide for running, maintaining, and troubleshooting the system.

---

## Service Status

| Service | URL | Health Check | Port |
|---------|-----|-------------|------|
| Frontend (SPA) | https://woven-model-purchase-system-production.up.railway.app | Page loads without console errors | 443 |
| Backend (API) | https://woven-model-purchase-system-production.up.railway.app | `GET /api/health` → `{"status":"ok"}` | 443 (8080 internal) |
| Licensing Server | https://woven-licensing-production.up.railway.app | Login/docs page loads | 443 |

> **Production runs on Railway.** Local dev runs on port 3001 (backend) / 5173 (frontend).

---

## Production Deployment (Railway)

### Deploying new code
```bash
# From the repo root
git add -A
git commit -m "describe change"
git push origin master
# Railway auto-deploys from the GitHub branch (master)
```

### Manual redeploy
```bash
railway redeploy --service woven-model-purchase-system --environment production --yes --from-source
```

### Deployment safety
- The start command is `npx prisma generate && npx tsx src/index.ts` — it does **NOT** run `prisma db push`.
- This prevents accidental table drops (the database is shared with the Licensing Platform).
- To apply a real schema change: `railway run --service woven-model-purchase-system npx prisma db push` (requires `--accept-data-loss` if Prisma warns).
- Verify a deploy by checking `railway logs -s woven-model-purchase-system` for the startup banner and no `db push` output.

### Railway access
```bash
railway link --service woven-model-purchase-system   # link local repo to the service
railway logs -s woven-model-purchase-system          # runtime logs
railway logs -s woven-model-purchase-system -b       # build logs
railway deployment list -s woven-model-purchase-system
```

---

## Startup Procedures (Local)

### Starting the System (full)
```bash
# Terminal 1: Backend
cd "Woven Model ProductPurchaseSystem\packages\backend"
npx tsx src/index.ts

# Terminal 2: Frontend
cd "Woven Model ProductPurchaseSystem\packages\frontend"
npm run dev
```

### Startup Verification
```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
curl http://localhost:3001/api/products
# → [array of products]
curl http://localhost:5173
# → HTML page (200 OK)
```

---

## Shutdown Procedures

### Graceful Shutdown (local)
```bash
taskkill /f /im node.exe
```

### Emergency Shutdown (local)
```bash
taskkill /f /fi "IMAGENAME eq node.exe"
```

---

## Monitoring

### Log Locations
- Backend logs go to **stdout** (terminal locally; `railway logs -s woven-model-purchase-system` in production)
- Email logs stored in DB table `EmailLog`
- All order events stored in DB table `OrderEvent`
- Backup runs logged as `[BackupService]` lines in stdout

### Key Metrics to Watch
| Metric | Where to See | Healthy Range |
|--------|-------------|---------------|
| Backend process | Railway status / Task Manager | Running, memory stable |
| API response time | Browser DevTools → Network | <500ms |
| License generation | Admin → License Report; order flow test | 100% success |
| Email delivery | Admin → Email Logs | <5% failure rate |
| Order completion | Admin → Dashboard | All orders complete |
| Database backup | Backups in `BACKUP_EMAIL` inbox | At least 1 daily |

### What to Check When Something Breaks

**Site won't load (production):**
1. `curl https://woven-model-purchase-system-production.up.railway.app/api/health`
2. `railway deployment list -s woven-model-purchase-system` — is the latest deploy SUCCESS?
3. `railway logs -s woven-model-purchase-system` — any startup errors?
4. Redeploy if the latest deploy failed.

**Login fails:**
1. Confirm `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Railway env match the licensing server's admin user (used for license-generation auth).
2. Verify `JWT_SECRET` didn't change.
3. Local: re-seed admin with `npx tsx src/seed.ts`.

**Cart/Checkout broken:**
1. Check browser console / backend logs for route errors.
2. Cart endpoints: `/cart/add` (POST), `/cart` (GET), `/cart/:productId` (DELETE).
3. Checkout: POST `/checkout/calculate`, POST `/checkout/place`.

**Licenses not generating / PENDING- keys:**
1. Licensing server up? https://woven-licensing-production.up.railway.app
2. `LICENSING_API_URL` correct in Railway env? (must be the `/api/v1` URL)
3. `ADMIN_EMAIL` / `ADMIN_PASSWORD` correct? (auth against licensing server)
4. Licensing DB tables intact? If licensing-side tables were dropped, redeploy the licensing service so it re-seeds.
5. Backend logs show `[LicensingClient]` / `[OrderService] Failed to generate license` errors.

**Emails not sending:**
1. `SMTP_HOST=mail.smtp2go.com`, `SMTP_PORT` one of 2525/587/465/8025.
2. `SMTP_USER` / `SMTP_PASS` are the SMTP2GO SMTP credentials.
3. Check `[EmailService] Using mail.smtp2go.com via <IP>:<port>` in startup logs — the service probes SMTP2GO IPs and picks a reachable one.
4. Check Email Logs in Admin panel.
5. SMTP2GO dashboard: https://app.smtp2go.com

**Backup email not received:**
1. Check `[BackupService]` lines in `railway logs`.
2. Confirm `BACKUP_EMAIL` (default `ceo@wovenmodel.com`) is correct.
3. Trigger on-demand via `POST /api/admin/backup` (admin auth).
4. Check spam folder + SMTP2GO activity.

---

## Database

### Production
- **Hosted on Railway** (PostgreSQL); the same instance is shared with the Licensing Platform.
- **Never** run `prisma db push --accept-data-loss` on the production DB unless you intend to drop tables.
- Backups: full DB emailed to `BACKUP_EMAIL` daily (60s after startup / on demand via `POST /api/admin/backup`).
- Inspect live data: `railway run --service woven-model-purchase-system npx prisma studio`

### Local
- Location: `packages/backend/prisma/dev.db` (SQLite, dev only) or any `DATABASE_URL`.
- Backup: `copy packages\backend\prisma\dev.db packages\backend\prisma\dev.db.backup`
- Restore: reverse the copy.
- Re-seed (resets non-customer data): `cd packages/backend && npx tsx src/seed.ts`
- View data: `cd packages/backend && npx prisma studio` (http://localhost:5555)

---

## .env Configuration Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | DB connection string | `postgresql://...` (Railway) / `file:./dev.db` (local) |
| `JWT_SECRET` | Yes | Auth signing key | Change in production |
| `LICENSING_API_URL` | Yes | Licensing server URL | `https://woven-licensing-production.up.railway.app/api/v1` |
| `LICENSING_API_KEY` | Yes | Licensing API key / admin password | `K23HzAshHAZEPqyI4` |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret | `sk_live_...` (empty = demo) |
| `SMTP_HOST` | Yes | SMTP2GO host | `mail.smtp2go.com` |
| `SMTP_PORT` | Yes | SMTP2GO port | `2525` |
| `SMTP_USER` | Yes | SMTP2GO username | `wovenmodel.com` |
| `SMTP_PASS` | Yes | SMTP2GO password | (SMTP2GO dashboard) |
| `SMTP_FROM` | Yes | From address | `ceo@wovenmodel.com` |
| `SMTP_REPLY_TO` | Yes | Reply-to address | `sales@wovenmodel.com` |
| `ADMIN_EMAIL` | Yes | Licensing auth email | `admin@wovenmodel.com` |
| `ADMIN_PASSWORD` | Yes | Licensing auth password | (must match licensing server admin) |
| `BACKUP_EMAIL` | No | Backup recipient | `ceo@wovenmodel.com` |
| `TAX_RATE` | No | Tax decimal | `0.08` for 8% |

---

## Common Tasks

### Running the end-to-end purchase test
```bash
# From repo root — buys a product and emails confirmation + license + thank-you
npx tsx test-purchase.ts judewow@gmail.com        # CONQUEST (default)
npx tsx test-purchase.ts judewow@gmail.com PII    # any product code
```

### Adding a new product
1. Sign in as admin at the storefront.
2. Profile → Admin → Products.
3. Add Product: name, code (uppercase, unique), price, category, license type.
4. Features as JSON array: `["Feature 1", "Feature 2"]`.
5. Create — appears on the store immediately.

### Creating a coupon
1. Admin → Coupons.
2. Add Coupon: code (uppercase), type (percentage/fixed), value, optional min order / max uses / expiry.
3. Create — usable at checkout (e.g. `WELCOME10`).

### Viewing order details
1. Admin → Orders.
2. Find order by number or customer email.
3. Expand to see items, payments, license keys, events.

### Editing / deactivating a product
1. Admin → Products.
2. Pencil icon edits name/price/description.
3. **Deactivate** hides a product from the store (orders still reference it).

### Resetting admin password
1. Local: update `ADMIN_PASSWORD` in `.env`, run `npx tsx src/seed.ts`.
2. Production: update `ADMIN_PASSWORD` in Railway env; the licensing server's admin must match.

---

*© 2026 Woven Model. Last updated: August 14, 2026*
