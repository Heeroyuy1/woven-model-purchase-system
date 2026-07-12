import { PrismaClient } from '@prisma/client';
import { getPaymentProcessor } from './paymentService';
import { licensingClient } from './licensingService';
import { emailService } from './emailService';
import { env } from '../config/env';

const prisma = new PrismaClient();

export async function processOrder(orderId: string, paymentMethod: string, paymentToken: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
      licenses: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'pending') {
    throw new Error(`Order cannot be processed. Current status: ${order.status}`);
  }

  // Step 1: Process payment
  const processor = getPaymentProcessor(paymentMethod);
  const paymentResult = await processor.processPayment(
    order.total,
    order.currency,
    paymentToken,
    `Order #${order.orderNumber}`
  );

  if (!paymentResult.success) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });
    await prisma.orderEvent.create({
      data: {
        orderId,
        event: 'payment_failed',
        details: JSON.stringify({ error: paymentResult.error, method: paymentMethod }),
      },
    });
    throw new Error(`Payment failed: ${paymentResult.error}`);
  }

  // Step 2: Record payment
  await prisma.payment.create({
    data: {
      orderId,
      method: paymentMethod,
      transactionId: paymentResult.transactionId,
      amount: order.total,
      currency: order.currency,
      status: 'succeeded',
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'confirmed', paidAt: new Date(), paymentMethod, paymentId: paymentResult.transactionId },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      event: 'paid',
      details: JSON.stringify({ transactionId: paymentResult.transactionId, method: paymentMethod }),
    },
  });

  // Step 3: Generate invoice
  const invoiceNumber = `INV-${order.orderNumber}`;
  await prisma.invoice.create({
    data: {
      orderId,
      invoiceNumber,
      total: order.total,
      taxAmount: order.taxAmount,
      status: 'paid',
      paidAt: new Date(),
    },
  });

  // Step 4: Generate licenses via licensing server for each item
  const generatedLicenses: any[] = [];

  for (const item of order.items) {
    const licenseType = item.licenseType || 'perpetual';
    const perpetual = licenseType === 'perpetual' || licenseType === 'enterprise' || licenseType === 'developer';

    try {
      const licenseResult = await licensingClient.generateLicense({
        productCode: item.productCode,
        userId: order.customer.licensingUserId || 1,
        licenseType,
        maxActivations: licenseType === 'enterprise' ? 999 : 2,
        expirationDays: perpetual ? 0 : 365,
        perpetual,
      });

      // Store license in our database
      const dbLicense = await prisma.license.create({
        data: {
          licenseKey: licenseResult.license_key,
          licenseType,
          status: 'active',
          activationLimit: licenseResult.max_activations,
          perpetual,
          expirationDate: licenseResult.expiration_date ? new Date(licenseResult.expiration_date) : null,
          licensingLicenseId: licenseResult.id,
          customerId: order.customerId,
          productId: item.productId,
          orderId,
          orderItemId: item.id,
        },
      });
      generatedLicenses.push(dbLicense);
    } catch (error: any) {
      console.error(`[OrderService] Failed to generate license for ${item.productCode}:`, error.message);
      // Create a placeholder license in our DB
      const placeholderLicense = await prisma.license.create({
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
      generatedLicenses.push(placeholderLicense);
    }
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      event: 'license_generated',
      details: JSON.stringify({ count: generatedLicenses.length }),
    },
  });

  // Step 5: Send order confirmation email
  try {
    await emailService.sendOrderConfirmation(order.customer.email, {
      name: `${order.customer.firstName} ${order.customer.lastName}`,
      orderNumber: order.orderNumber,
      date: new Date().toISOString().split('T')[0],
      products: order.items.map(i => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice })),
      total: order.total,
    });
  } catch (error: any) {
    console.error('[OrderService] Failed to send order confirmation email:', error.message);
  }

  // Send license delivery email for each license
  for (const lic of generatedLicenses) {
    try {
      await emailService.sendLicenseDelivery(order.customer.email, {
        productName: lic.licenseType,
        licenseKey: lic.licenseKey,
        version: '1.0.0',
        downloadUrl: `https://downloads.wovenmodel.com/${lic.id}`,
        portalUrl: `${env.FRONTEND_URL || 'http://localhost:5173'}/portal/licenses`,
      });
    } catch (error: any) {
      console.error('[OrderService] Failed to send license delivery email:', error.message);
    }
  }

  // Send thank you email
  try {
    await emailService.sendThankYou(order.customer.email, {
      name: `${order.customer.firstName} ${order.customer.lastName}`,
    });
  } catch (error: any) {
    console.error('[OrderService] Failed to send thank you email:', error.message);
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      event: 'email_sent',
      details: JSON.stringify({ types: ['order_confirmation', 'license_delivery', 'thank_you'] }),
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      customerId: order.customerId,
      type: 'order_completed',
      title: 'Order Completed',
      message: `Order #${order.orderNumber} has been completed successfully. License keys are ready.`,
    },
  });

  // Step 6: Mark order as completed
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

  return { success: true, order: await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, licenses: true, payments: true, invoices: true },
  })};
}
