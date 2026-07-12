import { Router, Request, Response, NextFunction } from 'express';
import { validateCoupon } from '../services/couponService';

const router = Router();

// POST /validate
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Coupon code is required' });
      return;
    }
    const result = await validateCoupon(code, subtotal);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
