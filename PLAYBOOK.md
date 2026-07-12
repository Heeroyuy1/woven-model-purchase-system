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
| **Stripe** | Payment processing | API key in `.env` |
| **Gmail SMTP** | Email delivery (confirmations, licenses, follow-ups) | App Password in `.env` |
| **SQLite/PostgreSQL** | Data storage | Prisma ORM |

---

## 2. Business Roles

### Who Uses What

| Role | Access | Key Actions |
|------|--------|-------------|
| **Customer** | Public store + Customer Portal | Browse, purchase, download licenses, view orders |
| **Admin** | Admin Dashboard | Manage products, orders, customers, generate licenses, view reports |
| **System Operator** | Backend terminal + .env | Server startup, configuration, troubleshooting |

### Customer Journey (Automated)

1. User lands on storefront → browses products with pricing, features, screenshots
2. Creates account or signs in
3. Adds product(s) to cart with quantity
4. Proceeds to checkout → fills billing info
5. Selects payment method (Stripe/PayPal)
6. Order placed → automatic:
   - Credit card charged
   - License generated on Licensing Server
   - License stored in local DB
   - Email sent: **Order Confirmation**
   - Email sent: **License Key Delivery**
   - Email sent: **Thank You / Onboarding**
7. Customer can view order + license keys in portal

---

## 3. Admin Operations

### Product Management

**Adding a product to the store:**
1. Sign in as admin at `http://localhost:5173`
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
1. Admin → Coupons (in admin menu)
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

## 6. Launch Checklist

Before taking the system live:

### Payment Processing
- [ ] Stripe account created and verified
- [ ] `STRIPE_SECRET_KEY` set in `.env`
- [ ] Test transaction completed with `tok_visa`
- [ ] Refund process understood

### Email Delivery
- [ ] SMTP credentials tested
- [ ] Order confirmation email received
- [ ] License delivery email received
- [ ] Thank-you email received
- [ ] Check spam folder — add to allowlist

### Licensing
- [ ] Licensing server accessible from production network
- [ ] License generation tested end-to-end
- [ ] License appears in admin panel

### Security
- [ ] `JWT_SECRET` changed from default
- [ ] Admin password changed from default
- [ ] HTTPS configured (reverse proxy or Railway deployment)
- [ ] Database backup scheduled

### Storefront Polish
- [ ] Product descriptions reviewed
- [ ] Pricing confirmed
- [ ] Screenshots uploaded (optional)
- [ ] FAQ content added to products
- [ ] Category organization reviewed

---

## 7. Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Invalid email or password" | Wrong credentials or DB not seeded | Run `npx tsx src/seed.ts` |
| Cart shows empty after adding | API path mismatch | Add items via `/cart/add` endpoint |
| License key starts with "PENDING-" | Licensing server unreachable | Check `LICENSING_API_URL` and Railway status |
| No emails received | SMTP not configured or App Password expired | Update `SMTP_PASS` in `.env` |
| Admin page shows blank | Not logged in as admin | Sign in as `admin@wovenmodel.com` |
| 401 errors on API calls | JWT expired or missing | Re-login to get fresh token |
| 500 Internal Server Error | Backend crash | Check terminal logs, restart server |

---

## 8. Business Continuity

### If Licensing Server Goes Down
- New orders will still be created in local DB
- License keys will be prefixed with `PENDING-`
- Admin can retry license generation later via Admin → Licenses → Generate
- No data loss — all order info is stored locally

### If Email Server Goes Down
- Order and license data is still recorded
- Emails are logged to `EmailLog` table
- Admin can view failed emails via Admin → Email Logs
- Emails can be manually sent or retried after SMTP is restored

### If Database Corrupts
- Regular backups exist at `prisma/dev.db.backup`
- Prisma Studio can inspect and repair data
- Re-seeding repopulates products, coupons, and templates
- Customer and order data would need separate restore

---

## 9. Future Expansion (Architecture Ready)

The system is designed to support these features with minimal changes:

| Feature | What's Ready |
|---------|-------------|
| **Product Bundles** | Order items can represent bundles |
| **Team/Enterprise Licensing** | License `activationLimit` field supports 999+ |
| **Volume Discounts** | Coupon system can be extended for tiered pricing |
| **Affiliate Program** | Coupon codes can track affiliate attribution |
| **Recurring Subscriptions** | `Subscription` model exists, license expiry dates |
| **Multi-currency** | `currency` field on Order model |
| **Multi-language** | Frontend is React — i18n library can be added |
| **Customer Reviews** | `ProductReview` model exists in schema |
| **Wishlist** | Cart system can be adapted for wishlist |

---

## 10. Key Contacts & Resources

| Resource | Location |
|----------|----------|
| Licensing Server Admin | https://woven-licensing-production.up.railway.app |
| Licensing API Docs | FastAPI auto-generated docs available via the server |
| Database GUI | `npx prisma studio` (runs on port 5555) |
| Backend Logs | Terminal running `npx tsx src/index.ts` |
| Source Code | `c:\Woven Model\Development\Internal Tools\Woven Model ProductPurchaseSystem` |
| Email Configuration | Gmail App Password: https://myaccount.google.com/apppasswords |
| Stripe Dashboard | https://dashboard.stripe.com |

---

## 11. Daily Operations Checklist

- [ ] Check Admin Dashboard for new orders overnight
- [ ] Review Email Logs for any delivery failures
- [ ] Verify licensing server is responsive
- [ ] Check for any 500 errors in backend terminal

### Weekly
- [ ] Review Sales Report for revenue trends
- [ ] Check Product Report for top/bottom performers
- [ ] Review License Report for expiring licenses
- [ ] Backup database: `copy prisma\dev.db prisma\dev.db.weekly`

### Monthly
- [ ] Full backup of all configurations
- [ ] Review and prune expired coupons
- [ ] Update product versions and release notes
- [ ] Audit admin user accounts

---

*© 2026 Woven Model. Last updated: July 2026*
