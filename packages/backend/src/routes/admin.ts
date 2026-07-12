import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { licensingClient } from '../services/licensingService';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);
router.use(requireAdmin);

// GET /stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalOrders, totalRevenue, totalCustomers, totalProducts, totalLicenses] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['completed', 'confirmed'] } } }),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.license.count(),
    ]);

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true, customer: { select: { firstName: true, lastName: true, email: true } } },
    });

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts,
      totalLicenses,
      ordersByStatus: ordersByStatus.map(o => ({ status: o.status, count: o._count })),
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

// GET /orders
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, startDate, endDate, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate as string) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, customer: { select: { firstName: true, lastName: true, email: true } }, payments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    next(error);
  }
});

// GET /orders/:id
router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, customer: true, payments: true, invoices: true, licenses: { include: { product: true } }, events: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (error) { next(error); }
});

// PUT /orders/:id/status
router.put('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) },
    });
    await prisma.orderEvent.create({
      data: { orderId: order.id, event: `status_${status}`, details: JSON.stringify({ updatedBy: req.user!.id }) },
    });
    res.json(order);
  } catch (error) { next(error); }
});

// GET /customers
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: { id: true, email: true, firstName: true, lastName: true, company: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true, licenses: true } } },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers: customers.map(c => ({ ...c, orderCount: c._count.orders, licenseCount: c._count.licenses, _count: undefined })),
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) { next(error); }
});

// GET /customers/:id
router.get('/customers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { orders: true, licenses: true } },
        orders: { take: 20, orderBy: { createdAt: 'desc' }, include: { items: true } },
        licenses: { take: 20, orderBy: { createdAt: 'desc' }, include: { product: true } },
      },
    });
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
    res.json({ ...customer, orderCount: customer._count.orders, licenseCount: customer._count.licenses, _count: undefined });
  } catch (error) { next(error); }
});

// GET /products
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    res.json(products);
  } catch (error) { next(error); }
});

// POST /products
router.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, shortDescription, overview, pricing, category, licenseType, features, platformSupport, screenshots, systemRequirements, faqs, documentationUrl, trialAvailable, trialDays, version } = req.body;
    const product = await prisma.product.create({
      data: {
        name, code, shortDescription, overview, pricing: pricing || 0, category, licenseType: licenseType || 'perpetual',
        features: features ? JSON.stringify(features) : null,
        platformSupport: platformSupport ? JSON.stringify(platformSupport) : null,
        screenshots: screenshots ? JSON.stringify(screenshots) : null,
        systemRequirements: systemRequirements ? JSON.stringify(systemRequirements) : null,
        faqs: faqs ? JSON.stringify(faqs) : null,
        documentationUrl, trialAvailable: trialAvailable || false, trialDays: trialDays || 14, version: version || '1.0.0',
      },
    });
    res.status(201).json(product);
  } catch (error) { next(error); }
});

// PUT /products/:id
router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData: any = { ...req.body };
    // Map 'status' string field to 'active' boolean in DB
    if (updateData.status !== undefined) {
      updateData.active = updateData.status === 'active';
      delete updateData.status;
    }
    if (updateData.features) updateData.features = JSON.stringify(updateData.features);
    if (updateData.platformSupport) updateData.platformSupport = JSON.stringify(updateData.platformSupport);
    if (updateData.screenshots) updateData.screenshots = JSON.stringify(updateData.screenshots);
    if (updateData.faqs) updateData.faqs = JSON.stringify(updateData.faqs);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: updateData });
    res.json(product);
  } catch (error) { next(error); }
});

// DELETE /products/:id (soft delete)
router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Product deactivated' });
  } catch (error) { next(error); }
});

// GET /licenses
router.get('/licenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const licenses = await prisma.license.findMany({
      include: { product: { select: { name: true, code: true } }, customer: { select: { email: true, firstName: true, lastName: true } }, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(licenses);
  } catch (error) { next(error); }
});

// POST /licenses/generate
router.post('/licenses/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productCode, customerId, licenseType = 'perpetual', maxActivations = 2, expirationDays = 0, perpetual = true } = req.body;

    const product = await prisma.product.findUnique({ where: { code: productCode } });
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }

    // Generate via licensing server
    const licenseResult = await licensingClient.generateLicense({
      productCode, userId: customer.licensingUserId || 1,
      licenseType, maxActivations, expirationDays, perpetual,
    });

    const license = await prisma.license.create({
      data: {
        licenseKey: licenseResult.license_key, licenseType, status: 'active', activationLimit: maxActivations, perpetual,
        expirationDate: expirationDays > 0 ? new Date(Date.now() + expirationDays * 86400000) : null,
        licensingLicenseId: licenseResult.id, customerId, productId: product.id, orderId: '',
      },
    });

    res.status(201).json(license);
  } catch (error) { next(error); }
});

// PUT /licenses/:id/revoke
router.put('/licenses/:id/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: { status: 'revoked', notes: req.body.reason ? `Revoked: ${req.body.reason}` : 'Revoked by admin' },
    });
    res.json(license);
  } catch (error) { next(error); }
});

// GET /reports/sales
router.get('/reports/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const where: any = { status: { in: ['completed', 'confirmed'] } };
    if (startDate) where.paidAt = { ...(where.paidAt || {}), gte: new Date(startDate as string) };
    if (endDate) where.paidAt = { ...(where.paidAt || {}), lte: new Date(endDate as string) };

    const orders = await prisma.order.findMany({ where, select: { total: true, paidAt: true, createdAt: true } });

    const grouped: Record<string, { revenue: number; count: number }> = {};
    for (const order of orders) {
      const date = order.paidAt || order.createdAt;
      const key = period === 'daily' ? date.toISOString().split('T')[0] : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
      grouped[key].revenue += order.total;
      grouped[key].count += 1;
    }

    const sales = Object.entries(grouped).map(([period, data]) => ({ period, ...data, revenue: Math.round(data.revenue * 100) / 100 }));
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    res.json({ sales, totalRevenue: Math.round(totalRevenue * 100) / 100, totalOrders });
  } catch (error) { next(error); }
});

// GET /reports/products
router.get('/reports/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productName', 'productCode'],
      _sum: { totalPrice: true, quantity: true },
      _count: true,
      orderBy: { _sum: { totalPrice: 'desc' } },
    });

    res.json(items.map(i => ({
      productName: i.productName,
      productCode: i.productCode,
      totalRevenue: Math.round((i._sum.totalPrice || 0) * 100) / 100,
      totalQuantity: i._sum.quantity || 0,
      orderCount: i._count,
    })));
  } catch (error) { next(error); }
});

// GET /reports/licenses
router.get('/reports/licenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalLicenses = await prisma.license.count();
    const byStatus = await prisma.license.groupBy({ by: ['status'], _count: true });
    const byType = await prisma.license.groupBy({ by: ['licenseType'], _count: true });
    const last30Days = await prisma.license.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });
    res.json({ totalLicenses, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })), byType: byType.map(t => ({ type: t.licenseType, count: t._count })), last30Days });
  } catch (error) { next(error); }
});

// ─── Coupon management ───

// GET /coupons
router.get('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (error) { next(error); }
});

// POST /coupons
router.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body;
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description, discountType, discountValue,
        minOrderAmount: minOrderAmount || null,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json(coupon);
  } catch (error: any) {
    if (error.code === 'P2002') res.status(409).json({ error: 'Coupon code already exists' });
    else next(error);
  }
});

// PUT /coupons/:id
router.put('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData: any = { ...req.body };
    if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt);
    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: updateData });
    res.json(coupon);
  } catch (error) { next(error); }
});

// DELETE /coupons/:id
router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) { next(error); }
});

// GET /email-logs
router.get('/email-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.emailLog.findMany({ orderBy: { sentAt: 'desc' }, take: 100 });
    res.json(logs);
  } catch (error) { next(error); }
});

export default router;
