// Global error handler for startup (must be first)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

import dotenv from 'dotenv';
import path from 'path';

// Load .env if it exists (Railway provides env vars directly)
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} catch {
  // .env may not exist on Railway - that's fine, env vars are provided directly
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check - MUST be before route imports that could fail
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy-import routes after health check is registered
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import checkoutRoutes from './routes/checkout';
import orderRoutes from './routes/orders';
import licenseRoutes from './routes/licenses';
import adminRoutes from './routes/admin';
import portalRoutes from './routes/portal';
import couponRoutes from './routes/coupons';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/coupons', couponRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Serve the frontend storefront (built React app)
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback: serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server with error logging
try {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[PurchaseSystem] Server running on 0.0.0.0:${env.PORT}`);
    console.log(`[PurchaseSystem] Licensing API: ${env.LICENSING_API_URL}`);
    console.log(`[PurchaseSystem] Frontend: ${env.FRONTEND_URL}`);
    console.log(`[PurchaseSystem] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}

export default app;
