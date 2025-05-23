import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/error";
import { extractToken } from "../utils/auth";
import { TokenPayload } from "../../types";
import { config } from "../../config/environment";
import { prisma } from "../../config/database.config";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

export class AuthMiddleware {
  static protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) {
        return next(new AppError("You are not logged in. Please log in to get access.", 401));
      }
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          passwordChangedAt: true,
        },
      });

      if (!currentUser) {
        return next(new AppError("The user belonging to this token no longer exists.", 401));
      }

      if (currentUser.passwordChangedAt) {
        const changedTimestamp = Math.floor(new Date(currentUser.passwordChangedAt).getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
          return next(new AppError("User recently changed password! Please log in again.", 401));
        }
      }

      req.user = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid token. Please log in again.", 401));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError("Your token has expired! Please log in again.", 401));
      }
      return next(new AppError("Authentication failed", 401));
    }
  };

  static restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        return next(new AppError("You are not logged in", 401));
      }

      if (!roles.includes(req.user.role)) {
        return next(new AppError("You do not have permission to perform this action", 403));
      }

      next();
    };
  };

  constructor(private jwtSecret: string = config.jwt.secret, private userModel = prisma.user) {}

  protectInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) {
        return next(new AppError("You are not logged in. Please log in to get access.", 401));
      }

      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;

      const currentUser = await this.userModel.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          passwordChangedAt: true,
        },
      });

      if (!currentUser) {
        return next(new AppError("The user belonging to this token no longer exists.", 401));
      }

      if (currentUser.passwordChangedAt) {
        const changedTimestamp = Math.floor(new Date(currentUser.passwordChangedAt).getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
          return next(new AppError("User recently changed password! Please log in again.", 401));
        }
      }

      req.user = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid token. Please log in again.", 401));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError("Your token has expired! Please log in again.", 401));
      }
      return next(new AppError("Authentication failed", 401));
    }
  };

  restrictToInstance = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        return next(new AppError("You are not logged in", 401));
      }

      if (!roles.includes(req.user.role)) {
        return next(new AppError("You do not have permission to perform this action", 403));
      }

      next();
    };
  };
}

export const protect = AuthMiddleware.protect;
export const restrictTo = AuthMiddleware.restrictTo;
