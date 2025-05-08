"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const error_1 = require("../utils/error");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const contentType = req.headers["content-type"];
            const isMultipartFormData = contentType && contentType.includes("multipart/form-data");
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
                    }
                    else {
                        validationObject.body.files = req.files;
                    }
                }
            }
            await schema.parseAsync(validationObject);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => ({
                    path: err.path.join("."),
                    message: err.message,
                }));
                return next(new error_1.AppError(`Validation error: ${JSON.stringify(errorMessages)}`, 400));
            }
            return next(error);
        }
    };
};
exports.validateRequest = validateRequest;
