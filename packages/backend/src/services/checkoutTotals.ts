import { PrismaClient } from '@prisma/client';
import { validateCoupon } from './couponService';
import { env } from '../config/env';

const prisma = new PrismaClient();

export const DEFAULT_CURRENCY = 'USD';

/**
 * Domain error carrying the HTTP status the API should return.
 */
export class CheckoutError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CheckoutError';
    this.statusCode = statusCode;
  }
}

export interface CheckoutLine {
  productId: string;
  productName: string;
  productCode: string;
  licenseType: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CheckoutTotals {
  items: CheckoutLine[];
  subtotal: number;
  discount: number;
  discountType: string | null;
  couponCode: string | null;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  amountInCents: number;
}

/** All money maths is done in integer cents to avoid float drift. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

async function loadCartLines(customerId: string): Promise<CheckoutLine[]> {
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new CheckoutError('Cart is empty', 400);
  }

  const inactive = cartItems.find((item) => !item.product.active);
  if (inactive) {
    throw new CheckoutError(
      `"${inactive.product.name}" is no longer available. Please remove it from your cart.`,
      409
    );
  }

  return cartItems.map((item) => {
    const unitPrice = item.product.pricing;

    return {
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.code,
      licenseType: item.product.licenseType ?? null,
      quantity: item.quantity,
      unitPrice,
      totalPrice: fromCents(toCents(unitPrice) * item.quantity),
    };
  });
}

/**
 * The single authoritative calculation for a cart.
 * Every endpoint that displays or charges money uses this, so the price the
 * customer sees is exactly the price Stripe charges.
 */
export async function calculateCartTotals(
  customerId: string,
  couponCode?: string | null
): Promise<CheckoutTotals> {
  const items = await loadCartLines(customerId);

  const subtotalCents = items.reduce(
    (sum, line) => sum + toCents(line.unitPrice) * line.quantity,
    0
  );

  const normalisedCouponCode = couponCode?.trim() ? couponCode.trim().toUpperCase() : null;

  let discountCents = 0;
  let discountType: string | null = null;

  if (normalisedCouponCode) {
    const result = await validateCoupon(normalisedCouponCode, fromCents(subtotalCents));

    if (!result.valid) {
      throw new CheckoutError(result.error ?? 'Invalid coupon code', 400);
    }

    discountCents = toCents(result.discount ?? 0);
    discountType = result.discountType ?? null;
  }

  const taxRate = env.TAX_RATE;
  const taxableCents = Math.max(subtotalCents - discountCents, 0);
  const taxCents = Math.round(taxableCents * taxRate);
  const totalCents = taxableCents + taxCents;

  if (totalCents <= 0) {
    throw new CheckoutError(
      'This order total is zero. Remove the coupon or add a paid product before checking out.',
      400
    );
  }

  return {
    items,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    discountType,
    couponCode: normalisedCouponCode,
    taxRate,
    taxAmount: fromCents(taxCents),
    total: fromCents(totalCents),
    currency: DEFAULT_CURRENCY,
    amountInCents: totalCents,
  };
}
