/**
 * Test Purchase Script — walks the complete purchase workflow against the
 * deployed system and emails the order confirmation, license key and thank-you
 * emails to the buyer, plus the internal "new sale" notification to
 * ceo@wovenmodel.com.
 *
 * Usage:
 *   npx tsx test-purchase.ts [buyer-email] [product-code] [payment-intent-id]
 *
 * Card handling:
 *   - sk_test_ key: the script confirms the PaymentIntent with Stripe's
 *     `pm_card_visa` test card, so the whole flow runs end to end.
 *   - sk_live_ key: the script NEVER charges a card. It stops after creating
 *     the PaymentIntent, you pay in the browser, then re-run with the
 *     PaymentIntent id as the third argument to finish fulfilment.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, 'packages/backend/.env') });

const BASE_URL =
  process.env.TEST_BASE_URL || 'https://woven-model-purchase-system-production.up.railway.app';
const TOKEN = process.env.TEST_TOKEN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const args = process.argv.slice(2);
const BUYER_EMAIL = args[0] || process.env.TEST_EMAIL || 'judewow@gmail.com';
const PRODUCT_CODE = args[1] || process.env.TEST_PRODUCT || 'HARPER';
const EXISTING_PAYMENT_INTENT = args[2] || process.env.TEST_PAYMENT_INTENT || '';
const PASSWORD = 'TestPassword123!';

const IS_TEST_MODE = STRIPE_SECRET_KEY.startsWith('sk_test_');

const BILLING_ADDRESS = {
  line1: '1 Test Way',
  city: 'Portland',
  state: 'OR',
  postalCode: '97201',
  country: 'United States',
};

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
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function banner(title: string): void {
  console.log('\n' + '='.repeat(64));
  console.log(`  ${title}`);
  console.log('='.repeat(64));
}

async function main(): Promise<void> {
  banner(`Woven Model Purchase Test — buyer: ${BUYER_EMAIL}`);

  // 1. Login or register
  let token = TOKEN;
  if (!token) {
    const login = await api('POST', '/api/auth/login', { email: BUYER_EMAIL, password: PASSWORD });
    if (login.status === 200) {
      token = login.data.token;
      console.log('[1/6] Login OK');
    } else {
      const reg = await api('POST', '/api/auth/register', {
        email: BUYER_EMAIL,
        password: PASSWORD,
        firstName: 'Jude',
        lastName: 'Woven',
        company: 'Woven Model',
      });
      if (reg.status !== 201 && reg.status !== 409) {
        throw new Error(`Register failed: ${JSON.stringify(reg.data).slice(0, 200)}`);
      }
      token = reg.data.token;
      console.log('[1/6] Register OK');
    }
  }

  // 2. Find product
  const products = await api('GET', '/api/products');
  const product = (products.data || []).find((p: any) => p.code === PRODUCT_CODE);
  if (!product) {
    console.error(`Product ${PRODUCT_CODE} not found. Available:`);
    (products.data || []).forEach((p: any) =>
      console.log(`  - ${p.code} (${p.name}, $${p.pricing})`)
    );
    throw new Error('Product not found');
  }
  console.log(`[2/6] Product: ${product.name} (${product.code}) — $${product.pricing}`);

  // 3. Add to cart
  if (!EXISTING_PAYMENT_INTENT) {
    const cart = await api('POST', '/api/cart/add', { productId: product.id, qty: 1 }, token);
    if (cart.status !== 200) throw new Error(`Add to cart failed: ${cart.status}`);
    console.log('[3/6] Add to cart OK');
  } else {
    console.log('[3/6] Skipped (finishing an existing PaymentIntent)');
  }

  // 4. Create / adopt the PaymentIntent
  let paymentIntentId = EXISTING_PAYMENT_INTENT;
  let orderId = '';

  if (!paymentIntentId) {
    const intentRes = await api(
      'POST',
      '/api/checkout/create-payment-intent',
      { billingAddress: BILLING_ADDRESS },
      token
    );

    if (intentRes.status !== 200) {
      throw new Error(
        `create-payment-intent failed: ${intentRes.status} ${JSON.stringify(intentRes.data).slice(0, 300)}`
      );
    }

    paymentIntentId = intentRes.data.paymentIntentId;
    orderId = intentRes.data.orderId;

    console.log(`[4/6] PaymentIntent ${paymentIntentId}`);
    console.log(`      order:  ${intentRes.data.orderNumber} (${orderId})`);
    console.log(`      total:  $${intentRes.data.totals?.total}`);
  } else {
    console.log(`[4/6] Using existing PaymentIntent ${paymentIntentId}`);
  }
// 5. Confirm the card
  if (!EXISTING_PAYMENT_INTENT) {
    if (!IS_TEST_MODE) {
      banner('LIVE MODE — NO CARD WAS CHARGED');
      console.log('  This script will not charge a real card.');
      console.log('  Finish the payment in the browser, then re-run:');
      console.log(`    npx tsx test-purchase.ts ${BUYER_EMAIL} ${PRODUCT_CODE} ${paymentIntentId}`);
      console.log(`  Or open: ${BASE_URL}/checkout`);
      console.log('='.repeat(64));
      return;
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa',
    });

    if (confirmed.status !== 'succeeded') {
      throw new Error(`PaymentIntent not confirmed (status: ${confirmed.status})`);
    }

    console.log(`[5/6] Card confirmed — ${confirmed.id} (${confirmed.status})`);
  } else {
    console.log('[5/6] Skipped (payment already confirmed)');
  }

  // 6. Fulfil the order
  const orderRes = await api('POST', '/api/checkout/place', { paymentIntentId }, token);

  if (orderRes.status !== 201 && orderRes.status !== 200) {
    throw new Error(
      `Order failed: ${orderRes.status} ${JSON.stringify(orderRes.data).slice(0, 300)}`
    );
  }

  const order = orderRes.data.order;
  if (!order) throw new Error('Order response contained no order');

  console.log('[6/6] Order fulfilled:');
  console.log(`      number:    ${order.orderNumber}`);
  console.log(`      status:    ${order.status}`);
  console.log(`      subtotal:  $${order.subtotal}`);
  console.log(`      tax:       $${order.taxAmount}`);
  console.log(`      total:     $${order.total}`);
  console.log(
    `      payment:   ${
      (order.payments || [])
        .map((p: any) => `${p.method} (${p.status}, ${p.transactionId})`)
        .join(', ') || 'n/a'
    }`
  );
  console.log(
    `      invoice:   ${
      (order.invoices || []).map((i: any) => `${i.invoiceNumber} (${i.status})`).join(', ') || 'n/a'
    }`
  );

  const licenses = order.licenses || [];
  console.log(`\nLicenses (${licenses.length}):`);
  licenses.forEach((l: any) => console.log(`  ${l.licenseKey} (${l.status})`));

  const orders = await api('GET', '/api/orders', undefined, token);
  console.log(`\nVerify: ${orders.data?.length || 0} order(s) on file for ${BUYER_EMAIL}.`);

  banner('SUMMARY');
  console.log(`  Buyer:    ${BUYER_EMAIL}`);
  console.log(`  Product:  ${product.name} (${product.code})`);
  console.log(`  Order:    ${order.orderNumber} — ${order.status}`);
  console.log(`  Total:    $${order.total}`);
  console.log(`  License:  ${licenses[0]?.licenseKey || 'none'}`);
  console.log(`  Stripe:   ${paymentIntentId}`);
  console.log(`  Emails to ${BUYER_EMAIL}:`);
  console.log(`    - Order Confirmation (#${order.orderNumber})`);
  console.log('    - License Key Delivery');
  console.log('    - Thank You / Onboarding');
  console.log(`  Internal notification: ${process.env.PURCHASE_NOTIFICATION_EMAIL || 'ceo@wovenmodel.com'}`);
  console.log('  Check the inboxes + server logs ([EmailService] Sent).');
  console.log('='.repeat(64));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nTEST FAILED:', err.message);
    process.exit(1);
  });
