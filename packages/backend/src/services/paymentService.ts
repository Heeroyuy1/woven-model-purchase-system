import { getStripeClient, getStripeMode, StripeMode } from './stripeClient';
import { CheckoutError, CheckoutTotals } from './checkoutTotals';

export interface CreatedPaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface VerifiedPayment {
  id: string;
  amountReceived: number;
  currency: string;
  paymentMethodId: string | null;
  receiptUrl: string | null;
  status: string;
}

/** Stripe's minimum card charge, in cents. */
const MINIMUM_CHARGE_CENTS = 50;

/**
 * Creates a PaymentIntent for an order that has already been priced
 * server-side. The order id lives in the metadata so the webhook can
 * reconcile the charge back to the order if the browser never returns.
 */
export async function createPaymentIntentForOrder(params: {
  orderId: string;
  customerId: string;
  customerEmail: string;
  totals: CheckoutTotals;
}): Promise<CreatedPaymentIntent> {
  const { orderId, customerId, customerEmail, totals } = params;

  if (totals.amountInCents < MINIMUM_CHARGE_CENTS) {
    throw new CheckoutError(
      `Order total is below the minimum card charge of $${MINIMUM_CHARGE_CENTS / 100}.`,
      400
    );
  }

  const stripe = getStripeClient();

  const intent = await stripe.paymentIntents.create(
    {
      amount: totals.amountInCents,
      currency: totals.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail,
      description: `Woven Model order ${orderId}`,
      metadata: {
        orderId,
        customerId,
        couponCode: totals.couponCode ?? '',
        itemCount: String(totals.items.length),
      },
    },
    // One intent per order, so a retry reuses the existing authorisation
    // instead of creating a second one.
    { idempotencyKey: `payment_intent_${orderId}` }
  );

  if (!intent.client_secret) {
    throw new Error('Stripe did not return a client secret for the PaymentIntent.');
  }

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
  };
}

/**
 * Fetches a PaymentIntent and proves it actually settled for the amount the
 * order expects. Nothing is fulfilled until this passes.
 */
export async function verifyPaymentIntentForOrder(params: {
  paymentIntentId: string;
  expectedAmountInCents: number;
  expectedCurrency: string;
  expectedCustomerId: string;
}): Promise<VerifiedPayment> {
  const stripe = getStripeClient();

  const intent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
    expand: ['latest_charge'],
  });

  const ownerCustomerId = intent.metadata?.customerId;

  if (ownerCustomerId && ownerCustomerId !== params.expectedCustomerId) {
    throw new CheckoutError('This payment belongs to a different customer.', 403);
  }

  if (intent.status !== 'succeeded') {
    throw new CheckoutError(
      `Payment has not completed successfully (Stripe status: ${intent.status}).`,
      402
    );
  }

  if (intent.currency.toLowerCase() !== params.expectedCurrency.toLowerCase()) {
    throw new CheckoutError('Payment currency does not match the order currency.', 409);
  }

  const settledAmount = intent.amount_received > 0 ? intent.amount_received : intent.amount;

  if (settledAmount !== params.expectedAmountInCents) {
    throw new CheckoutError('Payment amount does not match the order total.', 409);
  }

  const charge = typeof intent.latest_charge === 'object' ? intent.latest_charge : null;

  return {
    id: intent.id,
    amountReceived: settledAmount,
    currency: intent.currency,
    paymentMethodId:
      typeof intent.payment_method === 'string'
        ? intent.payment_method
        : intent.payment_method?.id ?? null,
    receiptUrl: charge?.receipt_url ?? null,
    status: intent.status,
  };
}

export function getPaymentMode(): StripeMode {
  return getStripeMode();
}
