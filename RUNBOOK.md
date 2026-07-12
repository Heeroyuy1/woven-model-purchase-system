# Woven Model Product Purchase System — Runbook

## Operational guide for running, maintaining, and troubleshooting the system.

---

## Service Status

| Service | URL | Health Check | Port |
|---------|-----|-------------|------|
| Frontend (SPA) | http://localhost:5173 | Page loads without console errors | 5173 |
| Backend (API) | http://localhost:3001 | `GET /api/health` → `{"status":"ok"}` | 3001 |
| Licensing Server | https://woven-licensing-production.up.railway.app | Login page loads | 443 |

---

## Startup Procedures

### Starting the System (full)
```bash
# Terminal 1: Backend
cd "Woven Model ProductPurchaseSystem\packages\backend"
set DATABASE_URL=file:./dev.db
npx tsx src/index.ts
# Expected: "[PurchaseSystem] Server running on port 3001"

# Terminal 2: Frontend
cd "Woven Model ProductPurchaseSystem\packages\frontend"
npm run dev
# Expected: "VITE v6.4.3 ready in 900ms → http://localhost:5173"
```

### Startup Verification
```bash
# Check backend health
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}

# Check products endpoint
curl http://localhost:3001/api/products
# → [array of products] (should return 5 seeded products)

# Check frontend
curl http://localhost:5173
# → HTML page (200 OK)
```

---

## Shutdown Procedures

### Graceful Shutdown
```bash
# Kill all Node.js processes
taskkill /f /im node.exe
```

### Emergency Shutdown
```bash
# Force kill everything
taskkill /f /fi "IMAGENAME eq node.exe"
```

---

## Monitoring

### Log Locations
- Backend logs go to **stdout** (the terminal running `npx tsx src/index.ts`)
- Email logs stored in DB table `EmailLog`
- All order events stored in DB table `OrderEvent`
- Audit logs stored in DB table `AuditLog`

### Key Metrics to Watch
| Metric | Where to See | Healthy Range |
|--------|-------------|---------------|
| Backend process | Task Manager | Running, <200MB RAM |
| API response time | Browser DevTools → Network | <500ms |
| License generation | Admin → License Report | 100% success |
| Email delivery | Admin → Email Logs | <5% failure rate |
| Order completion | Admin → Dashboard | All orders complete |

### What to Check When Something Breaks

**Site won't load:**
1. `curl http://localhost:3001/api/health` — is API up?
2. `curl http://localhost:5173` — is frontend up?
3. `tasklist | findstr node` — are processes running?
4. Restart both servers

**Login fails:**
1. Try `admin@wovenmodel.com` / `K23HzAshHAZEPqyI4`
2. Check DB: `npx tsx src/seed.ts` to reset passwords
3. Verify JWT_SECRET in `.env` didn't change

**Cart/Checkout broken:**
1. Check browser console for API errors (F12 → Console)
2. Verify backend logs for route errors
3. Cart API paths: `/cart/add` (POST), `/cart` (GET), `/cart/:productId` (DELETE)
4. Checkout: POST `/checkout/calculate`, POST `/checkout/place`

**Licenses not generating:**
1. Verify licensing server is up: https://woven-licensing-production.up.railway.app
2. Check `LICENSING_API_URL` in `.env`
3. Check `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
4. Backend logs will show `[LicensingClient]` errors

**Emails not sending:**
1. Check `SMTP_PASS` is the 16-char App Password (no spaces)
2. Test SMTP directly with the test script
3. Check Email Logs in Admin panel
4. Gmail App Passwords expire — regenerate at https://myaccount.google.com/apppasswords

---

## Database

### Location
`packages/backend/prisma/dev.db`

### Backup
```bash
copy packages\backend\prisma\dev.db packages\backend\prisma\dev.db.backup
```

### Restore
```bash
copy packages\backend\prisma\dev.db.backup packages\backend\prisma\dev.db
```

### Re-seed (resets non-customer data)
```bash
cd packages/backend
set DATABASE_URL=file:./dev.db
npx tsx src/seed.ts
```

### Reset Everything (fresh database)
```bash
cd packages/backend
del prisma\dev.db
set DATABASE_URL=file:./dev.db
npx prisma db push
npx tsx src/seed.ts
```

### Viewing Data
```bash
cd packages/backend
npx prisma studio
# Opens a browser GUI at http://localhost:5555
```

---

## .env Configuration Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | SQLite DB path | `file:./dev.db` |
| `JWT_SECRET` | Yes | Auth signing key | Change in production |
| `LICENSING_API_URL` | Yes | Licensing server URL | `https://woven-licensing-production.up.railway.app/api/v1` |
| `LICENSING_API_KEY` | Yes | Licensing admin password | `K23HzAshHAZEPqyI4` |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret | `sk_live_...` |
| `SMTP_HOST` | For emails | SMTP server | `smtp.gmail.com` |
| `SMTP_USER` | For emails | SMTP username | `ceo@wovenmodel.com` |
| `SMTP_PASS` | For emails | App Password (16 chars) | `wwqkfwvvxalvdgvw` |
| `SMTP_FROM` | For emails | From address | `ceo@wovenmodel.com` |
| `SMTP_REPLY_TO` | For emails | Reply-to address | `sales@wovenmodel.com` |
| `ADMIN_EMAIL` | Yes | Licensing auth email | `admin@wovenmodel.com` |
| `ADMIN_PASSWORD` | Yes | Licensing auth password | `K23HzAshHAZEPqyI4` |
| `TAX_RATE` | No | Tax decimal | `0.08` for 8% |

---

## Common Tasks

### Adding a new product
1. Sign in as admin at http://localhost:5173
2. Click profile → Admin → Products
3. Click "Add Product"
4. Fill: name, code (uppercase, unique), price, category
5. Features: `["Feature 1", "Feature 2"]` (JSON array)
6. Click "Create"
7. Product appears on store immediately

### Creating a coupon
1. Sign in as admin
2. Navigate to http://localhost:5173/admin/coupons
3. Click "Add Coupon"
4. Set code (e.g., `SUMMER20`), discount type (percentage/fixed), value
5. Optionally set min order, max uses, expiration
6. Click "Create"
7. Users can apply at checkout

### Viewing order details
1. Admin → Orders
2. Find the order by number or customer email
3. Click the order to expand items, payments, license keys

### Resetting admin password
1. Run `npx tsx src/seed.ts` — this updates the admin user's password from `ADMIN_PASSWORD` in `.env`
2. Or directly via Prisma Studio

### Updating product prices
1. Admin → Products
2. Find the product, click the edit (✏️) icon
3. Change the price field
4. Click "Update"
5. Price updates instantly on store

---
