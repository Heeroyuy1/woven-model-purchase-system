import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  calculateSchema,
  createPaymentIntentSchema,
  placeOrderSchema,
} from '../validators/checkout';
import { CheckoutError, calculateCartTotals } from '../services/checkoutTotals';
import {
  createPaymentIntentForOrder,
  verifyPaymentIntentForOrder,
} from '../services/paymentService';
import {
  cancelStalePendingOrders,
  createPendingOrder,
  fulfillPaidOrder,
} from '../services/orderService';
import { env } from '../config/env';
import { getStripeMode, isStripeConfigured } from '../services/stripeClient';

const router = Router();
const prisma = new PrismaClient();

const ORDER_INCLUDE = {
  items: true,
  licenses: true,
  payments: true,
  invoices: true,
} as const;

function handleCheckoutError(error: any, res: Response, next: NextFunction): void {
  if (error instanceof CheckoutError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  next(error);
}

/**
 * Public configuration for the checkout page.
 * A publishable key is safe to expose; serving it from the backend keeps
 * Stripe.js in the same mode as the secret key without a frontend rebuild.
 */
router.get('/config', (_req: Request, res: Response) => {
  const mode = getStripeMode();

  res.json({
    stripeMode: mode,
    stripeEnabled: mode !== 'unconfigured',
    publishableKey: env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

router.use(requireAuth);

// POST /calculate - authoritative cart totals
router.post(
  '/calculate',
  validate(calculateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totals = await calculateCartTotals(req.user!.id, req.body.couponCode);
      res.json(totals);
    } catch (error) {
      handleCheckoutError(error, res, next);
    }
  }
);

/**
 * POST /create-payment-intent
 * Prices the cart, snapshots it into a pending order, then opens a Stripe
 * PaymentIntent for exactly that amount.
 */
router.post(
  '/create-payment-intent',
  validate(createPaymentIntentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isStripeConfigured()) {
        res.status(503).json({ error: 'Card payments are not configured. Please contact support.' });
        return;
      }

      const userId = req.user!.id;
      const { couponCode, billingAddress } = req.body;

      const totals = await calculateCartTotals(userId, couponCode);

      // Drop any earlier unpaid attempt so orders and authorisations do not pile up.
      await cancelStalePendingOrders(userId);

      const order = await createPendingOrder({ customerId: userId, totals, billingAddress });

      const intent = await createPaymentIntentForOrder({
        orderId: order.id,
        customerId: userId,
        customerEmail: req.user!.email,
        totals,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: intent.id, paymentMethod: 'stripe' },
      });

      res.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentIntentId: intent.id,
        clientSecret: intent.clientSecret,
        publishableKey: env.STRIPE_PUBLISHABLE_KEY || null,
        stripeMode: getStripeMode(),
        totals,
      });
    } catch (error) {
      handleCheckoutError(error, res, next);
    }
  }
);

/**
 * POST /place
 * Called after Stripe.js confirms the card. The PaymentIntent is re-read from
 * Stripe and the settled amount is checked against the stored order before
 * anything is fulfilled, so this endpoint cannot be used to obtain goods free.
 */
router.post(
  '/place',
  validate(placeOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { paymentIntentId } = req.body;

      const order = await prisma.order.findFirst({ where: { paymentId: paymentIntentId } });

      if (!order) {
        res.status(404).json({ error: 'No order is associated with this payment.' });
        return;
      }

      if (order.customerId !== userId) {
        res.status(403).json({ error: 'This payment belongs to a different customer.' });
        return;
      }

      // The webhook may already have fulfilled it - report the same result.
      if (order.status !== 'pending') {
        if (order.status === 'processing') {
          res.status(202).json({ order, pending: true, message: 'Payment is being finalised.' });
          return;
        }

        const existing = await prisma.order.findUnique({
          where: { id: order.id },
          include: ORDER_INCLUDE,
        });

        res.json({ order: existing, alreadyProcessed: true });
        return;
      }

      const payment = await verifyPaymentIntentForOrder({
        paymentIntentId,
        expectedAmountInCents: Math.round(order.total * 100),
        expectedCurrency: order.currency,
        expectedCustomerId: userId,
      });

      const fulfilled = await fulfillPaidOrder(order.id, payment);

      res.status(201).json({ order: fulfilled });
    } catch (error) {
      handleCheckoutError(error, res, next);
    }
  }
);

export default router;
