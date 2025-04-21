"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(error_handler_middleware_1.errorHandler);
exports.default = app;
