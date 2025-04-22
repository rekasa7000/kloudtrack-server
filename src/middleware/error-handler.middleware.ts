import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import logger from "../utils/logger";
import config from "../config/config";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  if (statusCode === 500 || !("isOperational" in err)) {
    logger.error(`[${req.method}] ${req.path} >> ${statusCode}: ${message}`, {
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export const asyncHandler = (fn: any) => {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
};
