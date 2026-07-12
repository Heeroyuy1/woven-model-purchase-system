import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// GET / - list current user's licenses
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const licenses = await prisma.license.findMany({
      where: { customerId: userId },
      include: {
        product: { select: { id: true, name: true, code: true, version: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(licenses);
  } catch (error) {
    next(error);
  }
});

// GET /:id - get single license
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const license = await prisma.license.findFirst({
      where: { id: req.params.id, customerId: userId },
      include: {
        product: true,
        order: { include: { items: true } },
        subscription: true,
      },
    });

    if (!license) {
      res.status(404).json({ error: 'License not found' });
      return;
    }

    res.json(license);
  } catch (error) {
    next(error);
  }
});

export default router;
