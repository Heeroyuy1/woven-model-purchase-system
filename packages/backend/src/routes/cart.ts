import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All cart routes require auth
router.use(requireAuth);

// GET / - get current user's cart
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const items = await prisma.cartItem.findMany({
      where: { customerId: userId },
      include: {
        product: {
          select: { id: true, name: true, code: true, pricing: true, screenshots: true, shortDescription: true },
        },
      },
    });

    const cartItems = items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.code,
      unitPrice: item.product.pricing,
      quantity: item.quantity,
      image: item.product.screenshots ? (JSON.parse(item.product.screenshots)[0] || null) : null,
    }));

    res.json({ items: cartItems });
  } catch (error) {
    next(error);
  }
});

// POST /add - add or update product quantity
router.post('/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { productId, qty = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const existing = await prisma.cartItem.findUnique({
      where: { customerId_productId: { customerId: userId, productId } },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
      });
    } else {
      await prisma.cartItem.create({
        data: { customerId: userId, productId, quantity: qty },
      });
    }

    res.json({ message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
});

// DELETE /:productId - remove item
router.delete('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    await prisma.cartItem.deleteMany({
      where: { customerId: userId, productId },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
});

// DELETE /all - clear cart (after the parameterized route)
router.delete('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await prisma.cartItem.deleteMany({ where: { customerId: userId } });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

export default router;
