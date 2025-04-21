"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const ajv = new ajv_1.default({ allErrors: true });
(0, ajv_formats_1.default)(ajv);
const validate = (schema, part = "body") => {
    const validateFn = ajv.compile(schema);
    return (req, res, next) => {
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
exports.validate = validate;
