"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
const auth_route_1 = require("./routes/auth.route");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Routes
app.use("/auth", auth_route_1.authRouter);
app.use(error_handler_middleware_1.errorHandler);
exports.default = app;
