import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import checkoutRoutes from './routes/checkout';
import orderRoutes from './routes/orders';
import licenseRoutes from './routes/licenses';
import adminRoutes from './routes/admin';
import portalRoutes from './routes/portal';
import couponRoutes from './routes/coupons';

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Start server
app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[PurchaseSystem] Server running on 0.0.0.0:${env.PORT}`);
  console.log(`[PurchaseSystem] Licensing API: ${env.LICENSING_API_URL}`);
  console.log(`[PurchaseSystem] Frontend: ${env.FRONTEND_URL}`);
  console.log(`[PurchaseSystem] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
