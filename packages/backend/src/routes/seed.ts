import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

// POST / - seed database with products, coupons, and demo accounts
// Protected by SEED_KEY in env (default: 'seed-me')
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;
    if (key !== (env as any).SEED_KEY && key !== 'seed-me') {
      res.status(403).json({ error: 'Invalid seed key' });
      return;
    }

    console.log('[Seed] Starting database seed...');

    // 1. Create/update admin user
    const adminPassword = await bcrypt.hash('K23HzAshHAZEPqyI4', 12);
    const admin = await prisma.customer.upsert({
      where: { email: 'admin@wovenmodel.com' },
      update: { password: adminPassword, role: 'admin' },
      create: {
        email: 'admin@wovenmodel.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
      },
    });
    console.log(`  Admin: admin@wovenmodel.com / K23HzAshHAZEPqyI4`);

    // 2. Create/update demo customer
    const customerPassword = await bcrypt.hash('Demo123!', 12);
    await prisma.customer.upsert({
      where: { email: 'demo@wovenmodel.com' },
      update: {},
      create: {
        email: 'demo@wovenmodel.com',
        password: customerPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: 'customer',
        company: 'Demo Corp',
        emailVerified: true,
      },
    });
    console.log(`  Customer: demo@wovenmodel.com / Demo123!`);

    // 3. Create products
    const products = [
      {
        name: 'Harper AI', code: 'HARPER',
        shortDescription: 'Intelligent AI assistant for content creation, analysis, and workflow automation.',
        overview: 'Harper AI is a powerful artificial intelligence assistant designed to transform how you work.',
        pricing: 199.00, version: '1.1.0', category: 'AI_APPS', licenseType: 'perpetual',
        trialAvailable: true, trialDays: 14,
        features: JSON.stringify(['Advanced NLP for content generation', 'Intelligent data analysis', 'Workflow automation', 'Multi-language support', 'API integrations', 'Custom AI model training', 'Real-time collaboration', 'Enterprise-grade security']),
        platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux']),
        systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB', storage: '2GB' }),
      },
      {
        name: 'Stratum Trading Strategy Analyzer', code: 'STRATUM',
        shortDescription: 'Professional-grade strategy analysis and backtesting for quantitative traders.',
        overview: 'Comprehensive backtesting, analysis, and optimization for trading strategies.',
        pricing: 299.00, version: '1.2.0', category: 'TRADING', licenseType: 'perpetual',
        trialAvailable: true, trialDays: 14,
        features: JSON.stringify(['Multi-asset backtesting', '100+ technical indicators', 'ML strategy optimization', 'Monte Carlo simulation', 'Portfolio-level analysis', 'Real-time market data', 'Custom reporting', 'API access']),
        platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+']),
        systemRequirements: JSON.stringify({ cpu: '6+ cores', ram: '16GB', storage: '5GB' }),
      },
      {
        name: 'AI Trading Strategy Analyzer', code: 'AI_TSA',
        shortDescription: 'ML-powered trading strategy analysis with predictive modeling and risk assessment.',
        overview: 'Leverages machine learning to provide deeper insights into trading strategy performance.',
        pricing: 149.00, version: '1.0.0', category: 'TRADING', licenseType: 'perpetual',
        trialAvailable: true, trialDays: 14,
        features: JSON.stringify(['Predictive modeling', 'Anomaly detection', 'Automated parameter optimization', 'Risk-adjusted return analysis', 'Walk-forward analysis', 'Custom ML model training', 'Integration with platforms', 'Cloud-based processing']),
        platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux', 'Cloud (Web)']),
        systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB', storage: '2GB' }),
      },
      {
        name: 'Backtesting Bot', code: 'BACKTESTING_BOT',
        shortDescription: 'Automated backtesting engine for rapid strategy validation and iteration.',
        overview: 'High-performance automated backtesting engine for rapid strategy development.',
        pricing: 99.00, version: '1.0.0', category: 'TRADING', licenseType: 'perpetual',
        trialAvailable: true, trialDays: 7,
        features: JSON.stringify(['High-performance engine (10,000+ tests/hour)', 'Parameter sweeping', 'Detailed metrics', 'Custom strategy scripting', 'Historical data management', 'Batch processing', 'Export CSV/JSON', 'API for pipelines']),
        platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux']),
        systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB', storage: '1GB' }),
      },
      {
        name: 'Conquest Trading Engine', code: 'CONQUEST',
        shortDescription: 'Enterprise-grade multi-asset trading execution platform with advanced order management.',
        overview: 'Professional trading execution platform for serious traders and institutions.',
        pricing: 499.00, version: '2.0.0', category: 'TRADING', licenseType: 'enterprise',
        trialAvailable: false,
        features: JSON.stringify(['Ultra-low latency execution', 'Multi-exchange support', 'Advanced order types', 'Real-time risk monitoring', 'Algorithmic strategies', 'Smart order routing', 'Customizable dashboard', 'API access', 'Multi-account management', 'Compliance logging']),
        platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Dedicated Server']),
        systemRequirements: JSON.stringify({ cpu: '8+ cores', ram: '32GB', storage: '10GB SSD' }),
      },
    ];

    for (const p of products) {
      await prisma.product.upsert({
        where: { code: p.code },
        update: { pricing: p.pricing, version: p.version },
        create: p,
      });
      console.log(`  Product: ${p.name}`);
    }

    // 4. Create coupon
    await prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10', description: '10% off your first purchase',
        discountType: 'percentage', discountValue: 10,
        maxUses: 100, isActive: true,
      },
    });
    console.log(`  Coupon: WELCOME10`);

    // 5. Create email templates
    const templates = [
      { name: 'order_confirmation', subject: 'Order Confirmation — {{orderNumber}}', htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>Order Confirmed</h1><p>Thank you {{customerName}}!</p></body></html>', variables: JSON.stringify(['customerName', 'orderNumber', 'orderDate', 'items', 'total']) },
      { name: 'license_delivery', subject: 'Your License for {{productName}} is Ready', htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>License Ready</h1><p>Your license key: {{licenseKey}}</p></body></html>', variables: JSON.stringify(['customerName', 'productName', 'licenseKey']) },
      { name: 'thank_you', subject: 'Thank You for Your Purchase!', htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>Thank You</h1><p>Thank you {{customerName}} for choosing Woven Model!</p></body></html>', variables: JSON.stringify(['customerName']) },
    ];
    for (const t of templates) {
      await prisma.emailTemplate.upsert({
        where: { name: t.name },
        update: { subject: t.subject, htmlBody: t.htmlBody },
        create: t,
      });
    }

    res.json({ message: 'Database seeded successfully', products: products.length });
  } catch (error) {
    next(error);
  }
});

export default router;
