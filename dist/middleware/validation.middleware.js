"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const error_1 = require("../utils/error");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error("Validation Errors:", error.issues);
            const zError = error.issues[0].message;
            next(new error_1.AppError(zError, 401));
        }
        else {
            next(new error_1.AppError("Invalid Data", 401));
        }
    }
};
exports.validate = validate;
