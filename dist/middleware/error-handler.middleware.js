"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config/config"));
const errorHandler = (err, req, res, next) => {
    const statusCode = "statusCode" in err ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";
    if (statusCode === 500 || !("isOperational" in err)) {
        logger_1.default.error(`[${req.method}] ${req.path} >> ${statusCode}: ${message}`, {
            stack: err.stack,
        });
    }
    res.status(statusCode).json({
        success: false,
        message,
        stack: config_1.default.NODE_ENV === "development" ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
