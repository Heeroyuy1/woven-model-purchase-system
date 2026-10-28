import { PrismaClient } from '@prisma/client';
import { getLicensingClient } from './licensingService';
import { emailService } from './emailService';
import { env } from '../config/env';
import { CheckoutError, CheckoutTotals } from './checkoutTotals';
import { VerifiedPayment } from './paymentService';
import { getStripeClient } from './stripeClient';

const prisma = new PrismaClient();

/** Pending orders older than this are considered abandoned. */
export const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000;

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${stamp}-${random}`;
}

/**
 * Snapshots the cart into a pending order. The order - not the cart - is the
 * record of what will be charged, so a cart edit afterwards cannot change the
 * price of an in-flight payment.
 */
export async function createPendingOrder(params: {
  customerId: string;
  totals: CheckoutTotals;
  billingAddress?: unknown;
}) {
  const { customerId, totals, billingAddress } = params;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discount,
      total: totals.total,
      currency: totals.currency,
      couponCode: totals.couponCode,
      billingAddress: JSON.stringify(billingAddress ?? {}),
      status: 'pending',
      paymentMethod: 'stripe',
      items: {
        create: totals.items.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          productCode: line.productCode,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          licenseType: line.licenseType,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      event: 'created',
      details: JSON.stringify({ itemCount: totals.items.length, total: totals.total }),
    },
  });

  return order;
}

/**
 * Expires this customer's unpaid pending orders so repeated checkout attempts
 * do not accumulate dangling orders and authorisations.
 */
export async function cancelStalePendingOrders(customerId: string): Promise<number> {
  const staleOrders = await prisma.order.findMany({
    where: { customerId, status: 'pending' },
    select: { id: true },
  });

  if (staleOrders.length === 0) {
    return 0;
  }

  const ids = staleOrders.map((order) => order.id);

  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status: 'expired' },
  });

  await prisma.orderEvent.createMany({
    data: ids.map((orderId) => ({
      orderId,
      event: 'expired',
      details: JSON.stringify({ reason: 'superseded_by_new_checkout' }),
    })),
  });

  return ids.length;
}
/**
 * Marks an order as being fulfilled. The conditional update is an atomic
 * compare-and-set, so the browser callback and the Stripe webhook cannot both
 * fulfil the same order.
 */
async function claimOrderForFulfilment(orderId: string): Promise<void> {
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'processing' },
  });

  if (claimed.count === 0) {
    throw new CheckoutError('This order has already been processed.', 409);
  }
}

async function generateLicensesForOrder(orderId: string, order: any) {
  const generated: any[] = [];

  for (const item of order.items) {
    const licenseType = item.licenseType || 'perpetual';
    const perpetual =
      licenseType === 'perpetual' || licenseType === 'enterprise' || licenseType === 'developer';

    try {
      const licenseResult = await getLicensingClient().generateLicense({
        productCode: item.productCode,
        userId: order.customer.licensingUserId || 1,
        licenseType,
        maxActivations: licenseType === 'enterprise' ? 999 : 2,
        expirationDays: perpetual ? 0 : 365,
        perpetual,
      });

      const dbLicense = await prisma.license.create({
        data: {
          licenseKey: licenseResult.license_key,
          licenseType,
          status: 'active',
          activationLimit: licenseResult.max_activations,
          perpetual,
          expirationDate: licenseResult.expiration_date
            ? new Date(licenseResult.expiration_date)
            : null,
          licensingLicenseId: licenseResult.id,
          customerId: order.customerId,
          productId: item.productId,
          orderId,
          orderItemId: item.id,
        },
      });

      generated.push(dbLicense);
    } catch (error: any) {
      console.error(
        `[OrderService] Failed to generate license for ${item.productCode}:`,
        error.message
      );

      // The customer has paid, so never drop the line - park it for an admin.
      const placeholder = await prisma.license.create({
        data: {
          licenseKey: `PENDING-${order.orderNumber}-${item.productCode}`,
          licenseType,
          status: 'pending',
          activationLimit: 1,
          perpetual,
          customerId: order.customerId,
          productId: item.productId,
          orderId,
          orderItemId: item.id,
          notes: `License pending generation. Error: ${error.message}`,
        },
      });

      generated.push(placeholder);
    }
  }

  return generated;
}

function sendFulfilmentEmails(
  order: any,
  generatedLicenses: any[],
  payment: VerifiedPayment
): void {
  setImmediate(async () => {
    try {
      await emailService.sendOrderConfirmation(order.customer.email, {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        orderNumber: order.orderNumber,
        date: new Date().toISOString().split('T')[0],
        products: order.items.map((i: any) => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
        total: order.total,
      });
    } catch (error: any) {
      console.error('[OrderService] Order confirmation email failed:', error.message);
    }

    const productNamesById = new Map<string, string>(
      order.items.map((i: any) => [i.productId, i.productName])
    );

    for (const license of generatedLicenses) {
      try {
        await emailService.sendLicenseDelivery(order.customer.email, {
          productName: productNamesById.get(license.productId) || license.licenseType,
          licenseKey: license.licenseKey,
          version: '1.0.0',
          downloadUrl: `https://downloads.wovenmodel.com/${license.id}`,
          portalUrl: `${env.FRONTEND_URL}/portal/licenses`,
        });
      } catch (error: any) {
        console.error('[OrderService] License delivery email failed:', error.message);
      }
    }

    try {
      await emailService.sendThankYou(order.customer.email, {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
      });
    } catch (error: any) {
      console.error('[OrderService] Thank-you email failed:', error.message);
    }

    // Internal notification so the owner sees every sale as it happens.
    try {
      await emailService.sendPurchaseNotification({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        items: order.items.map((item: any) => ({
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subtotal: order.subtotal,
        discount: order.discountAmount,
        taxAmount: order.taxAmount,
        total: order.total,
        currency: order.currency,
        paymentIntentId: payment.id,
        receiptUrl: payment.receiptUrl,
        licenseKeys: generatedLicenses
          .filter((license) => license.status === 'active')
          .map((license) => license.licenseKey),
        paidAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[OrderService] Owner purchase notification failed:', error.message);
    }
  });
}

/**
 * Fulfils an order whose payment has already been verified against Stripe.
 * Records the payment, issues the invoice and licenses, empties the cart and
 * notifies the customer.
 */
export async function fulfillPaidOrder(orderId: string, payment: VerifiedPayment) {
  await claimOrderForFulfilment(orderId);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} disappeared during fulfilment.`);
    }

    await prisma.payment.create({
      data: {
        orderId,
        method: 'stripe',
        transactionId: payment.id,
        amount: order.total,
        currency: order.currency,
        status: 'succeeded',
        gatewayResponse: JSON.stringify({
          paymentIntentId: payment.id,
          amountReceived: payment.amountReceived,
          paymentMethodId: payment.paymentMethodId,
          receiptUrl: payment.receiptUrl,
          stripeStatus: payment.status,
        }),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'confirmed',
        paidAt: new Date(),
        paymentMethod: 'stripe',
        paymentId: payment.id,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId,
        event: 'paid',
        details: JSON.stringify({
          transactionId: payment.id,
          amountReceived: payment.amountReceived,
        }),
      },
    });

    await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: `INV-${order.orderNumber}`,
        total: order.total,
        taxAmount: order.taxAmount,
        status: 'paid',
        paidAt: new Date(),
      },
    });

    const generatedLicenses = await generateLicensesForOrder(orderId, order);

    await prisma.orderEvent.create({
      data: {
        orderId,
        event: 'license_generated',
        details: JSON.stringify({ count: generatedLicenses.length }),
      },
    });

    // The purchase is complete, so the cart is no longer needed.
    await prisma.cartItem.deleteMany({ where: { customerId: order.customerId } });

    if (order.couponCode) {
      await prisma.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    sendFulfilmentEmails(order, generatedLicenses, payment);

    await prisma.orderEvent.create({
      data: {
        orderId,
        event: 'email_sent',
        details: JSON.stringify({
          types: ['order_confirmation', 'license_delivery', 'thank_you'],
        }),
      },
    });

    await prisma.notification.create({
      data: {
        customerId: order.customerId,
        type: 'order_completed',
        title: 'Order Completed',
        message: `Order #${order.orderNumber} has been completed. Your license keys are ready.`,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed', completedAt: new Date() },
    });

    await prisma.orderEvent.create({
      data: {
        orderId,
        event: 'completed',
        details: JSON.stringify({ totalLicenses: generatedLicenses.length }),
      },
    });

    return prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, licenses: true, payments: true, invoices: true },
    });
  } catch (error: any) {
    // Release the claim so the order can be retried (e.g. the licensing API
    // was briefly unavailable) without charging the customer again.
    await prisma.order
      .updateMany({ where: { id: orderId, status: 'processing' }, data: { status: 'pending' } })
      .catch(() => undefined);

    console.error(`[OrderService] Fulfilment failed for order ${orderId}:`, error.message);
    throw error;
  }
}
/**
 * Expires pending orders that were never paid for. Runs on a timer so an
 * abandoned checkout does not leave a stale order blocking the next attempt,
 * and so Stripe authorisations do not sit unused.
 */
export async function sweepAbandonedOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MS);

  const abandoned = await prisma.order.findMany({
    where: {
      status: 'pending',
      paymentMethod: 'stripe',
      createdAt: { lt: cutoff },
      payments: { none: { status: 'succeeded' } },
    },
    select: { id: true, paymentId: true },
  });

  if (abandoned.length === 0) {
    return 0;
  }

  const ids = abandoned.map((order) => order.id);

  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status: 'expired' },
  });

  await prisma.orderEvent.createMany({
    data: ids.map((orderId) => ({
      orderId,
      event: 'expired',
      details: JSON.stringify({ reason: 'abandoned_checkout' }),
    })),
  });

  // Best-effort: release any uncaptured authorisation left in Stripe.
  for (const order of abandoned) {
    if (!order.paymentId) continue;

    try {
      await getStripeClient().paymentIntents.cancel(order.paymentId);
    } catch {
      // Already cancelled, already succeeded, or not cancellable - ignore.
    }
  }

  console.log(`[OrderService] Expired ${ids.length} abandoned pending order(s).`);
  return ids.length;
}

/** Runs the abandoned-order sweep hourly for the lifetime of the process. */
export function startPendingOrderSweeper(): NodeJS.Timeout {
  const interval = setInterval(() => {
    sweepAbandonedOrders().catch((error: any) => {
      console.error('[OrderService] Abandoned order sweep failed:', error.message);
    });
  }, 60 * 60 * 1000);

  // Do not keep the process alive purely for the sweeper.
  interval.unref?.();

  return interval;
}
