# Woven Model Product Purchase System — Playbook

## Strategic guide for operating the commerce platform as a business.

---

## 1. System Overview

The Product Purchase System is the **front-end commerce layer** for all Woven Model software products. It handles the complete sales lifecycle:

```
Customer discovers product → Adds to cart → Checks out → License generated → Email delivered → Portal access granted
```

The system **automates everything** — no manual intervention required for standard purchases.

### Key Integrations

| System | Purpose | Connection |
|--------|---------|-----------|
| **Licensing Platform** (Railway) | License generation, activation, validation | API via `LICENSING_API_URL` |
| **Stripe** | Card payments — PaymentIntents + Stripe Elements, 3-D Secure supported | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **SMTP2GO** | Email delivery (confirmations, licenses, backups) | SMTP credentials + IP/port probing at startup |
| **PostgreSQL** (Railway) | Data storage (shared with the Licensing Platform) | Prisma ORM |
| **Database Backups** | Full DB → gzipped JSON emailed daily + on demand | `BACKUP_EMAIL` (default `ceo@wovenmodel.com`) |

---

## 2. Business Roles

### Who Uses What

| Role | Access | Key Actions |
|------|--------|-------------|
| **Customer** | Public store + Customer Portal | Browse, purchase, download licenses, view orders |
| **Admin** | Admin Dashboard | Manage products, orders, customers, generate licenses, view reports |
| **System Operator** | Backend terminal + .env + Railway | Server startup, configuration, deployment, troubleshooting |

### Customer Journey (Automated)

1. User lands on storefront → browses products with pricing, features, screenshots
2. Creates account or signs in
3. Adds product(s) to cart with quantity
4. Proceeds to checkout → fills billing info
5. Pays by card (Stripe Elements; 3-D Secure is handled automatically when the bank requires it)
6. Order placed → automatic:
   - Card charged through Stripe. The server then re-reads the PaymentIntent from Stripe and checks the settled amount against the stored order before anything is fulfilled — a `402` means the charge did not succeed and nothing was issued.
   - License generated on Licensing Server
   - License stored in local DB
   - Email sent: **Order Confirmation**
   - Email sent: **License Key Delivery** (uses the real product name)
   - Email sent: **Thank You / Onboarding**
7. Customer can view order + license keys in portal

---

## 3. Admin Operations

### Product Management

**Adding a product to the store:**
1. Sign in as admin at the storefront (production URL or `http://localhost:5173`)
2. Profile menu → Admin → Products
3. Click **"Add Product"**
4. Fill required fields (Name, Code, Price, Category, License Type)
5. Features field uses JSON array: `["Feature A", "Feature B"]`
6. Click **Create**
7. Product appears on the public store immediately

**Editing prices or descriptions:**
1. Admin → Products → find the product row
2. Click the pencil icon (Edit)
3. Change any field
4. Click **Update**

**Deactivating a product (hide from store):**
1. Admin → Products → find the product
2. Click **Deactivate**
3. Product disappears from public browsing but orders still reference it

### Coupon Management

**Creating a coupon:**
1. Admin → Coupons
2. Click **"Add Coupon"**
3. Set:
   - **Code**: e.g., `LAUNCH20` or `WELCOME10`
   - **Discount Type**: `percentage` or `fixed`
   - **Discount Value**: e.g., `20` for 20%, or `10.00` for $10 off
   - **Expires** (optional): date when coupon becomes invalid
   - **Max Uses** (optional): limit total redemptions
4. Click **Create**

**Coupon best practices:**
- Use uppercase codes for consistency
- Set max uses to prevent abuse
- Use percentage discounts for flexibility
- Test with `WELCOME10` (10% off, exists in seed data)

### Order Management

**Viewing orders:**
- Admin → Orders → see all orders with status filters
- Click any order to expand items, payment details, license keys

**Updating order status:**
- Inline dropdown on each order row
- Statuses: pending → confirmed → processing → completed
- Cancelled/refunded for problem orders

### License Management

**Manual license generation:**
- Admin → Licenses → "Generate License"
- Select product, customer, license type
- Set max activations
- License is created on both the Licensing Server and local DB

**Revoking a license:**
- Admin → Licenses → find the license
- Click **Revoke**
- License status changes to `revoked`
- Customer can no longer activate

---

## 4. Customer Portal Walkthrough

After signing in, customers access their portal via the profile menu:

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/portal/dashboard` | Stats overview, quick actions, recent orders |
| My Orders | `/portal/orders` | Order history with expandable details |
| My Licenses | `/portal/licenses` | License keys with copy-to-clipboard |
| Profile | `/portal/profile` | Edit name/company, change password |

---

## 5. Reports & Analytics

Access via Admin → Reports

### Sales Report
- **Daily vs Monthly** view
- Columns: Period, Revenue, Orders, Average Order Value
- Bar chart visualization of revenue
- Total summary at bottom

### Product Report
- Revenue and units sold per product
- Order count per product
- Identify top sellers

### License Report
- Total licenses issued
- By status (active, expired, revoked)
- By type (perpetual, subscription, trial)
- Last 30 days counter

### Using Reports for Business Decisions
- **Pricing adjustments**: Low sales on a product? Consider lowering price
- **Promotion timing**: Run a coupon campaign and measure order volume change
- **Customer growth**: Track new customer registrations over time
- **License compliance**: Monitor active vs expired licenses

---

## 6. Database Backups & Disaster Recovery

### Automated Backups
- A full database backup (all tables → gzipped JSON) is emailed to `BACKUP_EMAIL` (default **ceo@wovenmodel.com**):
  - **Daily** (every 24h)
  - **60 seconds after every deploy/boot**
  - **On demand** via `POST /api/admin/backup` (admin auth)
- Backups are created with read-only Prisma queries — the process never modifies the database.
- Filenames: `woven-model-purchase-backup-<timestamp>.json.gz`

### Production Safety
- The Railway start command is `npx prisma generate && npx tsx src/index.ts` — **no `prisma db push`**, so deployments never drop tables (the database is shared with the Licensing Platform).
- If you ever need a real schema change, apply it explicitly and carefully on Railway.

### If Licensing Server Goes Down
- New orders still complete; license keys get a `PENDING-` prefix.
- Admin can retry/supply licenses later (Admin → Licenses → Generate).
- No data loss — all order info is stored locally.
- **Known issue (Aug 2026):** a `prisma db push --accept-data-loss` deploy used to drop the shared DB's licensing tables, causing `500`/`401` license-generation failures. That risk is now removed (start command has no `db push`).

### If Stripe Goes Down
- Checkout cannot complete — `/api/checkout/create-payment-intent` will fail and the buyer sees the error inline.
- **No order is created and no license is issued**, because orders are only fulfilled after Stripe confirms the charge.
- Existing orders are unaffected; licenses already delivered stay valid.
- Check https://status.stripe.com, then retry the purchase.
- If the charge succeeded but the customer's browser died before returning, the Stripe webhook (`payment_intent.succeeded`) fulfils the order automatically within seconds. If that webhook is also failing, the order stays `pending` and an admin can reconcile it from Stripe Dashboard → Payments.
- Abandoned `pending` orders older than 24h are swept hourly and their Stripe intents cancelled automatically.

### If Email Server Goes Down
- Order and license data is still recorded.
- Emails are logged to `EmailLog`; admin can view failures via Admin → Email Logs.

### If Database Corrupts
- **Daily backups arrive in the `BACKUP_EMAIL` inbox** — restore from the latest `.json.gz`.
- Prisma Studio can inspect live data: `railway run --service woven-model-purchase-system npx prisma studio` (or locally `npx prisma studio`).

---

## 7. Testing the Full Purchase Flow

An end-to-end script is included in the repo root (`test-purchase.ts`):

```bash
# From the repo root
npx tsx test-purchase.ts judewow@gmail.com        # buys CONQUEST (default) → emails to that address
npx tsx test-purchase.ts someone@example.com PII  # buys a different product
```

The script:
1. Registers (or logs in) the buyer
2. Adds the product to the cart
3. Creates a real Stripe PaymentIntent for the cart total
4. Confirms the card — **only when the key is `sk_test_`**, using Stripe's `pm_card_visa` test card
5. Calls `/api/checkout/place`, which re-verifies the payment with Stripe before fulfilling
6. Prints order number, invoice, and license key

**Live keys are safe:** with an `sk_live_` key the script refuses to charge anything. It stops after creating the PaymentIntent and prints the command to finish afterwards, once the payment has been completed in the browser:

```bash
npx tsx test-purchase.ts judewow@gmail.com HARPER pi_3Abc...
```

**Verified production run (Aug 14, 2026):** order `ORD-MSSXMTU6-502H` (Conquest Trading Engine, $499) completed with license `5CJTA-PBZ85-NAZ34-PS65G`; all three emails delivered to judewow@gmail.com; daily backup email verified at ceo@wovenmodel.com.

---

## 8. Launch Checklist

### Payment Processing
- [ ] Stripe account activated (business details + bank account)
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` set in Railway — both from the same mode (`sk_live_` + `pk_live_`)
- [ ] Webhook destination created in Stripe pointing at `/api/webhooks/stripe`; `STRIPE_WEBHOOK_SECRET` set
- [ ] `GET /api/checkout/config` returns `"stripeMode":"live"`
- [ ] Stripe "Send test event" returns HTTP 200
- [ ] One real low-value purchase completed end to end (order + license + emails)
- [ ] Refund process understood (Stripe Dashboard → Payments → Refund)

### Email Delivery
- [ ] SMTP2GO credentials tested
- [ ] Order confirmation email received
- [ ] License delivery email received (shows product name)
- [ ] Thank-you email received
- [ ] Spam folder checked — allowlist addresses

### Licensing
- [ ] Licensing server accessible from production network
- [ ] License generation tested end-to-end (real key, not `PENDING-`)
- [ ] `LICENSING_API_URL` + `ADMIN_EMAIL`/`ADMIN_PASSWORD` set in Railway env
- [ ] License appears in admin panel

### Backups
- [ ] `BACKUP_EMAIL` set (defaults to ceo@wovenmodel.com)
- [ ] Daily backup email verified
- [ ] On-demand backup verified (`POST /api/admin/backup`)

### Security
- [ ] `JWT_SECRET` changed from default
- [ ] Admin password changed from default
- [ ] HTTPS configured (Railway provides it)
- [ ] Database backup scheduled (automated — verified)

### Storefront Polish
- [ ] Product descriptions reviewed
- [ ] Pricing confirmed
- [ ] FAQ content added to products
- [ ] Category organization reviewed

---

## 9. Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Invalid email or password" | Wrong credentials or DB not seeded | Run `npx tsx src/seed.ts` (local) |
| Cart shows empty after adding | API path mismatch | Add items via `/cart/add` endpoint |
| License key starts with "PENDING-" | Licensing server unreachable or bad admin creds | Check `LICENSING_API_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, licensing DB tables |
| License generation 500/401 | Licensing service's tables were dropped or creds mismatch | Redeploy licensing service (re-seeds admin); verify shared DB |
| No emails received | SMTP2GO unreachable from Railway network | Startup probes IPs/ports (2525/587/465/8025); check `[EmailService] Using ...` log line |
| No backup email | BACKUP_EMAIL wrong or SMTP down | Check `[BackupService]` logs; `POST /api/admin/backup` to trigger |
| Card form never appears at checkout | Publishable key missing, or secret/publishable keys from different modes | `GET /api/checkout/config`; the server refuses to boot when the two keys disagree |
| `402` "Payment has not completed" | Card was not actually confirmed | Finish the card form; check the PaymentIntent in the Stripe Dashboard |
| Webhook returns `503` | `STRIPE_WEBHOOK_SECRET` not set | Add it in Railway, redeploy |
| Server exits on boot with "Stripe configuration error" | `sk_live_` paired with `pk_test_` (or vice versa) | Use both keys from the same Stripe mode |
| Order completed but no "New Sale" email | `PURCHASE_NOTIFICATION_EMAIL` empty or SMTP down | Check that variable; inspect Email Logs for `purchase_notification` |
| Admin page shows blank | Not logged in as admin | Sign in as admin |
| 401 errors on API calls | JWT expired or missing | Re-login to get fresh token |
| 500 Internal Server Error | Backend crash | Check logs, restart server / redeploy |

---

## 10. Key Contacts & Resources

| Resource | Location |
|----------|----------|
| Purchase System (production) | https://woven-model-purchase-system-production.up.railway.app |
| Licensing Server Admin | https://woven-licensing-production.up.railway.app |
| Licensing API Docs | FastAPI auto-generated docs (available via the licensing server) |
| Database GUI | `npx prisma studio` (port 5555), or `railway run ... npx prisma studio` |
| Backend Logs | `railway logs -s woven-model-purchase-system` |
| Source Code | `c:\Woven Model\Development\Internal Tools\Woven Model ProductPurchaseSystem` |
| Email Configuration | SMTP2GO dashboard: https://app.smtp2go.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| Stripe Webhooks | https://dashboard.stripe.com/webhooks |
| Stripe Status | https://status.stripe.com |
| Store health check | `GET /api/health` on the production URL |
| Store Stripe mode | `GET /api/checkout/config` |

---

## 11. Daily Operations Checklist

- [ ] Check Admin Dashboard for new orders overnight
- [ ] Review Email Logs for any delivery failures
- [ ] Verify licensing server is responsive
- [ ] Confirm the daily backup email arrived in `BACKUP_EMAIL`
- [ ] Check for any 500 errors in backend logs

### Weekly
- [ ] Review Sales Report for revenue trends
- [ ] Check Product Report for top/bottom performers
- [ ] Review License Report for expiring licenses
- [ ] Spot-check one backup archive from the inbox

### Monthly
- [ ] Full backup of all configurations
- [ ] Review and prune expired coupons
- [ ] Update product versions and release notes
- [ ] Audit admin user accounts

---

*© 2026 Woven Model. Last updated: October 27, 2026*
