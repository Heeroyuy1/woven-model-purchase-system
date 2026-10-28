import { z } from 'zod';

const couponCodeSchema = z.string().trim().min(1).max(64).optional();

const billingAddressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(2).max(100),
});

export const calculateSchema = z.object({
  couponCode: couponCodeSchema,
});

/**
 * Creates the Stripe PaymentIntent for the current cart.
 * Totals are always derived server-side; the client cannot send a price.
 */
export const createPaymentIntentSchema = z.object({
  couponCode: couponCodeSchema,
  billingAddress: billingAddressSchema.optional(),
});

export const placeOrderSchema = z.object({
  // Stripe PaymentIntent id, e.g. pi_3Abc...
  paymentIntentId: z
    .string()
    .trim()
    .regex(/^pi_[A-Za-z0-9]+$/, 'A valid Stripe PaymentIntent id is required'),
  couponCode: couponCodeSchema,
  billingAddress: billingAddressSchema.optional(),
});
