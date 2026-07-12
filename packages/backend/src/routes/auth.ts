import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validators/auth';

const router = Router();
const prisma = new PrismaClient();

function generateToken(user: { id: string; email: string; role: string; firstName: string; lastName: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /register
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, company, phone } = req.body;

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const customer = await prisma.customer.create({
      data: { email, password: hashedPassword, firstName, lastName, company, phone },
    });

    const token = generateToken(customer);
    res.status(201).json({
      token,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        role: customer.role,
        company: customer.company,
        phone: customer.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!customer.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(customer);
    res.json({
      token,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        role: customer.role,
        company: customer.company,
        phone: customer.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, company: true, phone: true, createdAt: true },
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /profile
router.put('/profile', requireAuth, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { firstName, lastName, company, phone } = req.body;

    const updated = await prisma.customer.update({
      where: { id: user.id },
      data: { ...(firstName !== undefined && { firstName }), ...(lastName !== undefined && { lastName }), ...(company !== undefined && { company }), ...(phone !== undefined && { phone }) },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, company: true, phone: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /change-password
router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id: user.id } });
    if (!customer) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.customer.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
