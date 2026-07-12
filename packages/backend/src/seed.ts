import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from './config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create admin user — use password from .env
  const adminPlainPassword = env.ADMIN_PASSWORD || 'Admin123!';
  const adminPassword = await bcrypt.hash(adminPlainPassword, 12);
  const admin = await prisma.customer.upsert({
    where: { email: 'admin@wovenmodel.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@wovenmodel.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log(`  Admin user: admin@wovenmodel.com / ${adminPlainPassword}`);

  // 2. Create demo customer
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
  console.log(`  Demo customer: demo@wovenmodel.com / Demo123!`);

  // 3. Create products matching licensing-server products
  const products = [
    {
      name: 'Harper AI',
      code: 'HARPER',
      shortDescription: 'Intelligent AI assistant for content creation, analysis, and workflow automation.',
      overview: 'Harper AI is a powerful artificial intelligence assistant designed to transform how you work. Leveraging cutting-edge natural language processing and machine learning, Harper helps you create content, analyze data, automate repetitive tasks, and make better decisions faster.',
      pricing: 199.00,
      version: '1.1.0',
      category: 'AI_APPS',
      licenseType: 'perpetual',
      trialAvailable: true,
      trialDays: 14,
      features: JSON.stringify([
        'Advanced natural language processing for content generation',
        'Intelligent data analysis and visualization',
        'Workflow automation with custom triggers',
        'Multi-language support (50+ languages)',
        'Integration with popular tools and APIs',
        'Custom AI model training for domain-specific tasks',
        'Real-time collaboration and sharing',
        'Enterprise-grade security and compliance',
      ]),
      platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux (Ubuntu 20.04+)']),
      systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB minimum, 16GB recommended', storage: '2GB available', internet: 'Required for cloud features' }),
      screenshots: JSON.stringify(['/images/screenshots/harper-dashboard.png', '/images/screenshots/harper-editor.png']),
      faqs: JSON.stringify([
        { q: 'Is Harper AI available offline?', a: 'Some features work offline, but cloud features require internet connectivity.' },
        { q: 'How often is Harper AI updated?', a: 'We release updates quarterly with new features and improvements.' },
      ]),
      documentationUrl: 'https://docs.wovenmodel.com/harper',
      releaseNotes: JSON.stringify({ latest: '1.1.0', notes: ['Improved response accuracy by 35%', 'New API integrations', 'Performance optimizations'] }),
    },
    {
      name: 'Stratum Trading Strategy Analyzer',
      code: 'STRATUM',
      shortDescription: 'Professional-grade strategy analysis and backtesting for quantitative traders.',
      overview: 'Stratum provides comprehensive backtesting, analysis, and optimization for trading strategies. With support for multiple asset classes, advanced metrics, and machine learning-powered optimization, Stratum is the ultimate tool for serious quantitative traders.',
      pricing: 299.00,
      version: '1.2.0',
      category: 'TRADING',
      licenseType: 'perpetual',
      trialAvailable: true,
      trialDays: 14,
      features: JSON.stringify([
        'Multi-asset backtesting (stocks, crypto, forex, futures)',
        '100+ technical indicators and custom indicators',
        'Machine learning strategy optimization',
        'Monte Carlo simulation and risk analysis',
        'Portfolio-level analysis and correlation studies',
        'Real-time market data integration',
        'Custom reporting and export (PDF, CSV, Excel)',
        'API access for automated trading systems',
      ]),
      platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+']),
      systemRequirements: JSON.stringify({ cpu: '6+ cores recommended', ram: '16GB minimum, 32GB recommended', storage: '5GB', internet: 'Required for data feeds' }),
      screenshots: JSON.stringify(['/images/screenshots/stratum-backtest.png', '/images/screenshots/stratum-charts.png']),
      faqs: JSON.stringify([
        { q: 'Can I use Stratum with my broker?', a: 'Yes, Stratum supports major brokers and data providers.' },
        { q: 'Does Stratum support live trading?', a: 'Yes, through our API integration module.' },
      ]),
      documentationUrl: 'https://docs.wovenmodel.com/stratum',
      releaseNotes: JSON.stringify({ latest: '1.2.0', notes: ['New machine learning optimizer', 'Added portfolio correlation analysis', 'Performance improvements'] }),
    },
    {
      name: 'AI Trading Strategy Analyzer',
      code: 'AI_TSA',
      shortDescription: 'ML-powered trading strategy analysis with predictive modeling and risk assessment.',
      overview: 'AI Trading Strategy Analyzer leverages machine learning to provide deeper insights into trading strategy performance. With predictive modeling, anomaly detection, and automated parameter optimization, AI TSA helps traders identify profitable strategies and avoid common pitfalls.',
      pricing: 149.00,
      version: '1.0.0',
      category: 'TRADING',
      licenseType: 'perpetual',
      trialAvailable: true,
      trialDays: 14,
      features: JSON.stringify([
        'Predictive modeling for strategy performance',
        'Anomaly detection in trade patterns',
        'Automated parameter optimization',
        'Risk-adjusted return analysis (Sharpe, Sortino, Calmar)',
        'Walk-forward analysis and validation',
        'Custom machine learning model training',
        'Integration with Stratum and other platforms',
        'Cloud-based processing for large datasets',
      ]),
      platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux', 'Cloud (Web)']),
      systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB minimum', storage: '2GB', internet: 'Required' }),
      screenshots: JSON.stringify(['/images/screenshots/ai-tsa-analysis.png']),
      faqs: JSON.stringify([
        { q: 'Do I need Stratum to use AI TSA?', a: 'No, AI TSA works standalone, but integrates seamlessly with Stratum.' },
        { q: 'What machine learning models are used?', a: 'We use ensemble methods including random forests, gradient boosting, and neural networks.' },
      ]),
      documentationUrl: 'https://docs.wovenmodel.com/ai-tsa',
    },
    {
      name: 'Backtesting Bot',
      code: 'BACKTESTING_BOT',
      shortDescription: 'Automated backtesting engine for rapid strategy validation and iteration.',
      overview: 'Backtesting Bot is a high-performance automated backtesting engine designed for rapid strategy development and validation. Test thousands of strategy variations in minutes with detailed performance analytics and visualization.',
      pricing: 99.00,
      version: '1.0.0',
      category: 'TRADING',
      licenseType: 'perpetual',
      trialAvailable: true,
      trialDays: 7,
      features: JSON.stringify([
        'High-performance backtesting engine (10,000+ tests/hour)',
        'Parameter sweeping and optimization',
        'Detailed performance metrics and reports',
        'Custom strategy scripting',
        'Historical data management',
        'Batch processing for strategy comparisons',
        'Export results to CSV/JSON',
        'API for automated strategy pipelines',
      ]),
      platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Linux']),
      systemRequirements: JSON.stringify({ cpu: '4+ cores', ram: '8GB', storage: '1GB', internet: 'Optional' }),
      screenshots: JSON.stringify(['/images/screenshots/backtesting-results.png']),
      faqs: JSON.stringify([
        { q: 'Can I schedule automated backtests?', a: 'Yes, you can schedule batch runs via the API or command line.' },
        { q: 'What data sources are supported?', a: 'CSV import, Yahoo Finance, and major data providers.' },
      ]),
      documentationUrl: 'https://docs.wovenmodel.com/backtesting',
    },
    {
      name: 'Conquest Trading Engine',
      code: 'CONQUEST',
      shortDescription: 'Enterprise-grade multi-asset trading execution platform with advanced order management.',
      overview: 'Conquest is a professional trading execution platform designed for serious traders and institutions. With ultra-low latency execution, advanced order types, real-time risk management, and multi-exchange support, Conquest provides everything needed for professional trading operations.',
      pricing: 499.00,
      version: '2.0.0',
      category: 'TRADING',
      licenseType: 'enterprise',
      trialAvailable: false,
      features: JSON.stringify([
        'Ultra-low latency order execution (< 1ms)',
        'Multi-exchange and multi-broker support',
        'Advanced order types (OCO, OTO, bracket, trailing stop)',
        'Real-time position and risk monitoring',
        'Algorithmic trading strategies',
        'Smart order routing',
        'Customizable trading dashboard',
        'API for programmatic trading',
        'Multi-account and sub-account management',
        'Comprehensive audit and compliance logging',
      ]),
      platformSupport: JSON.stringify(['Windows 10/11', 'macOS 12+', 'Dedicated Server']),
      systemRequirements: JSON.stringify({ cpu: '8+ cores', ram: '32GB recommended', storage: '10GB SSD', internet: 'Low-latency connection recommended' }),
      screenshots: JSON.stringify(['/images/screenshots/conquest-dashboard.png', '/images/screenshots/conquest-order-book.png']),
      faqs: JSON.stringify([
        { q: 'What exchanges does Conquest support?', a: 'Support for 20+ major exchanges including Binance, Coinbase, Kraken, FTX, and more.' },
        { q: 'Is Conquest suitable for high-frequency trading?', a: 'Yes, with sub-millisecond execution and co-location options available.' },
      ]),
      documentationUrl: 'https://docs.wovenmodel.com/conquest',
      releaseNotes: JSON.stringify({ latest: '2.0.0', notes: ['Major architecture overhaul', 'New smart order routing', 'Enhanced risk management', 'Multi-exchange support'] }),
    },
  ];

  let licensingProductId = 1;
  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: { pricing: product.pricing, version: product.version, shortDescription: product.shortDescription },
      create: { ...product, licensingProductId: licensingProductId++ },
    });
    console.log(`  Product: ${product.name} (${product.code})`);
  }

  // 4. Create email templates
  const templates = [
    {
      name: 'order_confirmation',
      subject: 'Order Confirmation — {{orderNumber}}',
      htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>Order Confirmed</h1><p>Thank you {{customerName}}!</p></body></html>',
      variables: JSON.stringify(['customerName', 'orderNumber', 'orderDate', 'items', 'total']),
    },
    {
      name: 'license_delivery',
      subject: 'Your License for {{productName}} is Ready',
      htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>License Ready</h1><p>Your license key: {{licenseKey}}</p></body></html>',
      variables: JSON.stringify(['customerName', 'productName', 'licenseKey', 'productVersion', 'downloadUrl']),
    },
    {
      name: 'thank_you',
      subject: 'Thank You for Your Purchase!',
      htmlBody: '<html><body style="background:#0a0f1e;color:#fff"><h1>Thank You</h1><p>Thank you {{customerName}} for choosing Woven Model!</p></body></html>',
      variables: JSON.stringify(['customerName']),
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: { subject: template.subject, htmlBody: template.htmlBody },
      create: template,
    });
  }
  console.log('  Email templates created');

  // 5. Create a demo coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off your first purchase',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 100,
      isActive: true,
    },
  });
  console.log('  Coupon: WELCOME10 (10% off)');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
