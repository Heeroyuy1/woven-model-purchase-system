import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// GET /orders
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /licenses
router.get('/licenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const licenses = await prisma.license.findMany({
      where: { customerId: userId },
      include: { product: true, order: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(licenses);
  } catch (error) {
    next(error);
  }
});

// GET /downloads
router.get('/downloads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    // Get products user has licenses for
    const licenses = await prisma.license.findMany({
      where: { customerId: userId },
      include: { product: true },
      distinct: ['productId'],
    });

    const downloads = licenses.map(l => ({
      productId: l.product.id,
      productName: l.product.name,
      productCode: l.product.code,
      version: l.product.version,
      downloadUrl: `https://downloads.wovenmodel.com/${l.product.code.toLowerCase()}/${l.product.version}`,
      releaseNotes: l.product.releaseNotes ? JSON.parse(l.product.releaseNotes) : null,
    }));

    res.json(downloads);
  } catch (error) {
    next(error);
  }
});

// GET /profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const customer = await prisma.customer.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, company: true, phone: true, role: true, createdAt: true },
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, company, phone } = req.body;
    const updated = await prisma.customer.update({
      where: { id: userId },
      data: { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(company !== undefined && { company }), ...(phone !== undefined && { phone }) },
      select: { id: true, email: true, firstName: true, lastName: true, company: true, phone: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /notifications
router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// PUT /notifications/:id/read
router.put('/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { id: req.params.id, customerId: userId },
      data: { isRead: true },
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// POST /support
router.post('/support', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { subject, message, priority = 'normal' } = req.body;

    const supportRequest = await prisma.supportRequest.create({
      data: { customerId: userId, subject, message, priority },
    });

    res.status(201).json(supportRequest);
  } catch (error) {
    next(error);
  }
});

export default router;
