import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z, ZodError } from "zod";
import { AppError } from "../utils/error";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return next(
          new AppError(
            `Validation error: ${JSON.stringify(errorMessages)}`,
            400
          )
        );
      }
      return next(error);
    }
  };
};
