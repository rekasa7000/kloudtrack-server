import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/error";
import prisma from "../../config/database.config";
import config from "../../config/environment.config";

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

export const generateToken = (userId: number, res: Response) => {
  const token = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("zorb-jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: number;
      iat: number;
      exp: number;
    };

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
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        new Date(currentUser.passwordChangedAt).getTime() / 1000
      );

      if (decoded.iat < changedTimestamp) {
        return next(
          new AppError(
            "User recently changed password! Please log in again.",
            401
          )
        );
      }
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError("Your token has expired! Please log in again.", 401)
      );
    }
    return next(new AppError("Authentication failed", 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("You are not logged in", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};
