import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { getStripeClient, getStripeMode } from '../services/stripeClient';
import { fulfillPaidOrder } from '../services/orderService';

const router = Router();
const prisma = new PrismaClient();

/** Stripe signs the raw request body, so this route parses it itself. */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!env.STRIPE_WEBHOOK_SECRET) {
    if (getStripeMode() === 'live') {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not set - refusing unsigned live webhooks.');
      res.status(503).send('Webhook secret not configured');
      return;
    }

    console.warn('[Webhook] STRIPE_WEBHOOK_SECRET is not set - accepting unverified event (test mode).');
  }

  let event: Stripe.Event;

  try {
    if (env.STRIPE_WEBHOOK_SECRET) {
      if (!signature) {
        res.status(400).send('Missing Stripe signature');
        return;
      }

      event = getStripeClient().webhooks.constructEvent(
        req.body,
        signature as string,
        env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    }
  } catch (error: any) {
    console.error('[Webhook] Signature verification failed:', error.message);
    res.status(400).send(`Webhook error: ${error.message}`);
    return;
  }

  try {
    await handleEvent(event);
    res.json({ received: true });
  } catch (error: any) {
    // A 500 makes Stripe retry, which is what we want for transient failures
    // such as the licensing API being briefly unavailable.
    console.error(`[Webhook] Failed to process ${event.type}:`, error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      return;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      return;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      return;

    case 'charge.dispute.created':
      await handleDispute(event.data.object as Stripe.Dispute);
      return;

    default:
      // Unhandled types are acknowledged so Stripe stops retrying them.
      return;
  }
}

/**
 * Safety net for the browser callback: if the customer's tab closed after a
 * successful charge, the order is still fulfilled.
 */
/**
 * Stripe can deliver "Thin" payloads that carry only an object id. When that
 * happens, re-fetch the full object so the handler always has the metadata and
 * amounts it needs.
 */
async function hydratePaymentIntent(intent: Stripe.PaymentIntent): Promise<Stripe.PaymentIntent> {
  if (typeof intent.amount_received === 'number') {
    return intent;
  }

  return getStripeClient().paymentIntents.retrieve(intent.id);
}

async function handlePaymentSucceeded(rawIntent: Stripe.PaymentIntent): Promise<void> {
  const intent = await hydratePaymentIntent(rawIntent);
  const orderId = intent.metadata?.orderId;

  if (!orderId) {
    console.warn(`[Webhook] payment_intent ${intent.id} has no orderId metadata; ignoring.`);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    console.warn(`[Webhook] payment_intent ${intent.id} references unknown order ${orderId}.`);
    return;
  }

  if (!order.paymentId) {
    await prisma.order.update({ where: { id: orderId }, data: { paymentId: intent.id } });
  }

  if (order.status !== 'pending') {
    return;
  }

  if (intent.amount_received !== Math.round(order.total * 100)) {
    console.error(
      `[Webhook] Amount mismatch on order ${orderId}: charged ${intent.amount_received}, expected ${Math.round(
        order.total * 100
      )}. Manual review required.`
    );
    return;
  }

  await fulfillPaidOrder(orderId, {
    id: intent.id,
    amountReceived: intent.amount_received,
    currency: intent.currency,
    paymentMethodId:
      typeof intent.payment_method === 'string'
        ? intent.payment_method
        : intent.payment_method?.id ?? null,
    receiptUrl: null,
    status: intent.status,
  });

  console.log(`[Webhook] Order ${orderId} fulfilled from payment_intent ${intent.id}.`);
}

async function handlePaymentFailed(rawIntent: Stripe.PaymentIntent): Promise<void> {
  const intent = await hydratePaymentIntent(rawIntent);
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'payment_failed' },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      event: 'payment_failed',
      details: JSON.stringify({
        paymentIntentId: intent.id,
        lastPaymentError: intent.last_payment_error?.message ?? null,
      }),
    },
  });
}

async function handleChargeRefunded(rawCharge: Stripe.Charge): Promise<void> {
  // Thin payloads omit payment_intent, so hydrate from Stripe when needed.
  const charge =
    rawCharge.payment_intent === undefined
      ? await getStripeClient().charges.retrieve(rawCharge.id)
      : rawCharge;

  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({ where: { paymentId: paymentIntentId } });
  if (!order) return;

  await prisma.payment.updateMany({
    where: { transactionId: paymentIntentId },
    data: { status: charge.refunded ? 'refunded' : 'partially_refunded' },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      event: 'refunded',
      details: JSON.stringify({
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded,
        fullyRefunded: charge.refunded,
      }),
    },
  });
}

async function handleDispute(rawDispute: Stripe.Dispute): Promise<void> {
  const dispute =
    rawDispute.charge === undefined
      ? await getStripeClient().disputes.retrieve(rawDispute.id)
      : rawDispute;

  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  const charge = await getStripeClient().charges.retrieve(chargeId);
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({ where: { paymentId: paymentIntentId } });
  if (!order) return;

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      event: 'disputed',
      details: JSON.stringify({
        disputeId: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount,
      }),
    },
  });
}

export default router;
