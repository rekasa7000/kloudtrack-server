import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthUser } from '../types/auth.type';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, userName: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
      return;
    }

    next();
  };
};