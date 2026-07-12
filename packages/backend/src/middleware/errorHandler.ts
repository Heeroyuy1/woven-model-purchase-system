import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * Global error handler middleware
 * Returns { error: string, details?: any }
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error Handler]:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          error: 'A record with this value already exists',
          details: err.meta,
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: 'Record not found',
          details: err.meta,
        });
        return;
      case 'P2003':
        res.status(400).json({
          error: 'Referenced record does not exist',
          details: err.meta,
        });
        return;
      default:
        res.status(500).json({
          error: 'Database error',
          details: err.code,
        });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'Invalid data provided',
    });
    return;
  }

  // JWT errors
  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  // Generic errors with statusCode property
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}