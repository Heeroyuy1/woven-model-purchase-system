import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { calculateSchema, placeOrderSchema } from '../validators/checkout';
import { validateCoupon } from '../services/couponService';
import { processOrder } from '../services/orderService';
import { env } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// POST /calculate - calculate totals
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { couponCode } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { customerId: userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.pricing * item.quantity, 0);

    // Validate coupon
    let discount = 0;
    let appliedCoupon: any = null;
    if (couponCode) {
      const result = await validateCoupon(couponCode, subtotal);
      if (result.valid) {
        discount = result.discount!;
        appliedCoupon = { code: couponCode, discount, type: result.discountType };
      } else {
        res.status(400).json({ error: result.error });
        return;
      }
    }

    const taxRate = env.TAX_RATE;
    const taxableAmount = subtotal - discount;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    res.json({
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.pricing,
        totalPrice: item.product.pricing * item.quantity,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      coupon: appliedCoupon,
      taxRate,
      taxAmount,
      total,
    });
  } catch (error) {
    next(error);
  }
});

// POST /place - place order
router.post('/place', validate(placeOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { paymentMethod, paymentToken, couponCode, billingAddress } = req.body;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { customerId: userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.pricing * item.quantity, 0);

    // Validate coupon if provided
    let discount = 0;
    if (couponCode) {
      const result = await validateCoupon(couponCode, subtotal);
      if (result.valid) {
        discount = result.discount!;
      }
    }

    const taxRate = env.TAX_RATE;
    const taxableAmount = subtotal - discount;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: userId,
        subtotal,
        taxAmount,
        discountAmount: discount,
        total,
        couponCode: couponCode || null,
        billingAddress: JSON.stringify(billingAddress),
        status: 'pending',
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productCode: item.product.code,
            quantity: item.quantity,
            unitPrice: item.product.pricing,
            totalPrice: item.product.pricing * item.quantity,
            licenseType: item.product.licenseType,
          })),
        },
      },
      include: { items: true },
    });

    // Log order event
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'created',
        details: JSON.stringify({ itemCount: cartItems.length, total }),
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { customerId: userId } });

    // Process order (payment, license generation, emails)
    try {
      const result = await processOrder(order.id, paymentMethod, paymentToken);
      res.status(201).json({ order: result.order });
    } catch (error: any) {
      // Order was created but processing failed
      res.status(200).json({
        order,
        warning: error.message,
        message: 'Order created but processing encountered an issue. Our team will follow up.',
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
