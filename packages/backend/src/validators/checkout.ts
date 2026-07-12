import { z } from 'zod';

export const calculateSchema = z.object({
  couponCode: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, 'At least one item is required'),
});

export const placeOrderSchema = z.object({
  paymentMethod: z.enum(['stripe', 'paypal'], {
    errorMap: () => ({ message: 'Payment method must be "stripe" or "paypal"' }),
  }),
  paymentToken: z.string().min(1, 'Payment token is required'),
  couponCode: z.string().optional(),
  billingAddress: z.object({
    line1: z.string().min(1).max(255),
    line2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().min(2).max(100),
  }),
});