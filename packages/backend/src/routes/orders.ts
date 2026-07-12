import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// GET / - list current user's orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: true,
        licenses: { select: { id: true, licenseKey: true, status: true } },
        payments: { select: { method: true, status: true, transactionId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /:id - get single order
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, customerId: userId },
      include: {
        items: true,
        licenses: true,
        payments: true,
        invoices: true,
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, customerId: userId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({ error: 'Only pending orders can be cancelled' });
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        event: 'cancelled',
        details: JSON.stringify({ requestedBy: userId }),
      },
    });

    res.json({ message: 'Order cancelled' });
  } catch (error) {
    next(error);
  }
});

export default router;
