import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z, ZodError } from "zod";
import { AppError } from "../utils/error";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = req.headers["content-type"];
      const isMultipartFormData =
        contentType && contentType.includes("multipart/form-data");

      const validationObject = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      if (isMultipartFormData) {
        if (req.file) {
          validationObject.body.file = req.file;
        }

        if (req.files) {
          if (Array.isArray(req.files)) {
            validationObject.body.files = req.files;
          } else {
            validationObject.body.files = req.files;
          }
        }
      }

      await schema.parseAsync(validationObject);

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
