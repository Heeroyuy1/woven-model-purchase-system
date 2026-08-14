/**
 * Test Purchase Script — walks the complete purchase workflow against the
 * deployed system and emails the order confirmation, license key, and
 * thank-you emails to the buyer address (default judewow@gmail.com).
 *
 * Usage:
 *   npx tsx test-purchase.ts [buyer-email] [product-code]
 *   npx tsx test-purchase.ts judewow@gmail.com HARPER
 *
 * Defaults: buyer judewow@gmail.com, product HARPER (Harper AI).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Point .env at the backend package's .env when run from the repo root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, 'packages/backend/.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'https://woven-model-purchase-system-production.up.railway.app';
const TOKEN = process.env.TEST_TOKEN;

const args = process.argv.slice(2);
const BUYER_EMAIL = args[0] || process.env.TEST_EMAIL || 'judewow@gmail.com';
const PRODUCT_CODE = args[1] || process.env.TEST_PRODUCT || 'HARPER';
const PASSWORD = 'TestPassword123!';

async function api(method: string, route: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

function banner(title: string): void {
  console.log('\n' + '═'.repeat(64));
  console.log(`  ${title}`);
  console.log('═'.repeat(64));
}

async function main(): Promise<void> {
  banner(`Woven Model Purchase Test — buyer: ${BUYER_EMAIL}`);

  // ── 1. Login or register ───────────────────────────────────────────────
  let token = TOKEN;
  if (!token) {
    const login = await api('POST', '/api/auth/login', { email: BUYER_EMAIL, password: PASSWORD });
    if (login.status === 200) {
      token = login.data.token;
      console.log('[1/5] Login OK');
    } else {
      const reg = await api('POST', '/api/auth/register', {
        email: BUYER_EMAIL,
        password: PASSWORD,
        firstName: 'Jude',
        lastName: 'Woven',
        company: 'Woven Model',
      });
      if (reg.status !== 201 && reg.status !== 409) throw new Error(`Register failed: ${JSON.stringify(reg.data).slice(0, 200)}`);
      token = reg.data.token;
      console.log('[1/5] Register OK');
    }
  }

  // ── 2. Find product ────────────────────────────────────────────────────
  const products = await api('GET', '/api/products');
  const product = (products.data || []).find((p: any) => p.code === PRODUCT_CODE);
  if (!product) {
    console.error(`Product ${PRODUCT_CODE} not found. Available:`);
    (products.data || []).forEach((p: any) => console.log(`  - ${p.code} (${p.name}, $${p.pricing})`));
    throw new Error('Product not found');
  }
  console.log(`[2/5] Product: ${product.name} (${product.code}) — $${product.pricing}`);

  // ── 3. Add to cart ─────────────────────────────────────────────────────
  const cart = await api('POST', '/api/cart/add', { productId: product.id, qty: 1 }, token);
  if (cart.status !== 200) throw new Error(`Add to cart failed: ${cart.status}`);
  console.log('[3/5] Add to cart OK');

  // ── 4. Place order (Stripe tok_visa → simulated payment) ───────────────
  const orderRes = await api(
    'POST',
    '/api/checkout/place',
    {
      paymentMethod: 'stripe',
      paymentToken: 'tok_visa',
      billingAddress: {
        line1: '1 Test Way',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'United States',
      },
    },
    token
  );
  if (orderRes.status !== 201 && orderRes.status !== 200) {
    throw new Error(`Order failed: ${orderRes.status} ${JSON.stringify(orderRes.data).slice(0, 300)}`);
  }
  const order = orderRes.data.order || orderRes.data;
  console.log('[4/5] Order placed:');
  console.log(`      number:    ${order.orderNumber}`);
  console.log(`      status:    ${order.status}`);
  console.log(`      subtotal:  $${order.subtotal}`);
  console.log(`      total:     $${order.total}`);
  console.log(`      payment:   ${(order.payments || []).map((p: any) => `${p.method} (${p.status}, ${p.transactionId})`).join(', ') || 'n/a'}`);
  console.log(`      invoice:   ${(order.invoices || []).map((i: any) => `${i.invoiceNumber} (${i.status})`).join(', ') || 'n/a'}`);

  // ── 5. Licenses ────────────────────────────────────────────────────────
  const licenses = order.licenses || [];
  console.log(`[5/5] Licenses (${licenses.length}):`);
  licenses.forEach((l: any) => console.log(`      ${l.productName ? `${l.productName} — ` : ''}${l.licenseKey} (${l.status})`));

  // ── Verify persisted order ─────────────────────────────────────────────
  const orders = await api('GET', '/api/orders', undefined, token);
  console.log(`\nVerify: ${orders.data?.length || 0} order(s) on file for ${BUYER_EMAIL}.`);

  banner('SUMMARY');
  console.log(`  Buyer:    ${BUYER_EMAIL}`);
  console.log(`  Product:  ${product.name} (${product.code})`);
  console.log(`  Order:    ${order.orderNumber} — ${order.status}`);
  console.log(`  License:  ${licenses[0]?.licenseKey || 'none'}`);
  console.log(`  Emails to ${BUYER_EMAIL}:`);
  console.log(`    • Order Confirmation → #${order.orderNumber}`);
  console.log('    • License Key Delivery (product name)');
  console.log('    • Thank You / Onboarding');
  console.log('  Check the inbox + Railway logs ([EmailService] Sent).');
  console.log('═'.repeat(64));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nTEST FAILED:', err.message);
    process.exit(1);
  });
