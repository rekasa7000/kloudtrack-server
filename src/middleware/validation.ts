import { TSchema } from "@sinclair/typebox";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { NextFunction, Request, Response } from "express";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

type RequestPart = "body" | "query" | "params" | "headers";

export const validate = <T extends TSchema>(
  schema: TSchema,
  part: RequestPart = "body"
) => {
  const validateFn = ajv.compile(schema);
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[part];
    const valid = validateFn(data);

    if (!valid) {
      res.status(400).json({
        message: `Validation error on part ${part}`,
        errors: validateFn.errors,
      });
    }
    next();
  };
};
