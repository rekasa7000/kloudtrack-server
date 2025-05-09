import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/error";

export const validate =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation Errors:", error.issues);
        const zError = error.issues[0].message;
        next(new AppError(zError, 401));
      } else {
        next(new AppError("Invalid Data", 401));
      }
    }
  };
