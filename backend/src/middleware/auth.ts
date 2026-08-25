import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthUser {
  id: string;
  email: string;
  timezone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  timezone: string;
  iat?: number;
  exp?: number;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Session expired or invalid token');
    }

    // Always fetch latest timezone and active user from DB to ensure server-side source of truth
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, timezone: true },
    });

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User associated with token no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
