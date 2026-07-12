import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET / - list active products
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    const where: any = { active: true };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { shortDescription: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const parsed = products.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : [],
      screenshots: p.screenshots ? JSON.parse(p.screenshots) : [],
      platformSupport: p.platformSupport ? JSON.parse(p.platformSupport) : [],
      systemRequirements: p.systemRequirements ? JSON.parse(p.systemRequirements) : null,
      faqs: p.faqs ? JSON.parse(p.faqs) : [],
      releaseNotes: p.releaseNotes ? JSON.parse(p.releaseNotes) : null,
    }));

    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

// GET /:id - get single product
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({
      ...product,
      features: product.features ? JSON.parse(product.features) : [],
      screenshots: product.screenshots ? JSON.parse(product.screenshots) : [],
      platformSupport: product.platformSupport ? JSON.parse(product.platformSupport) : [],
      systemRequirements: product.systemRequirements ? JSON.parse(product.systemRequirements) : null,
      faqs: product.faqs ? JSON.parse(product.faqs) : [],
      releaseNotes: product.releaseNotes ? JSON.parse(product.releaseNotes) : null,
      versionHistory: product.versionHistory ? JSON.parse(product.versionHistory) : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /category/:category - filter by category
router.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        category: req.params.category,
      },
      orderBy: { name: 'asc' },
    });

    const parsed = products.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : [],
      screenshots: p.screenshots ? JSON.parse(p.screenshots) : [],
    }));

    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

export default router;
