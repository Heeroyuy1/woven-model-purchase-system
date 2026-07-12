import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CouponValidationResult {
  valid: boolean;
  discount?: number;
  discountType?: string;
  discountValue?: number;
  error?: string;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return { valid: false, error: 'Coupon code not found' };
    }

    if (!coupon.isActive) {
      return { valid: false, error: 'This coupon is no longer active' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'This coupon has expired' };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'This coupon has reached its maximum usage limit' };
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required for this coupon`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = subtotal * (coupon.discountValue / 100);
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      valid: true,
      discount: Math.round(discount * 100) / 100,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
  } catch (error) {
    return { valid: false, error: 'Failed to validate coupon' };
  }
}
