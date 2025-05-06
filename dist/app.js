"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_middleware_1 = require("./core/middlewares/cors.middleware");
const error_handler_middleware_1 = require("./core/middlewares/error-handler.middleware");
const route_1 = __importDefault(require("./route"));
const error_1 = require("./core/utils/error");
const app = (0, express_1.default)();
// middleware
app.use(cors_middleware_1.customCors);
app.options(/(.*)/, (0, cors_1.default)(cors_middleware_1.corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
// routes
app.use("/", route_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
// error handler
app.use(error_handler_middleware_1.errorHandler);
app.use((req, res, next) => {
    next(new error_1.AppError("Not Found", 404));
});
// Export app without starting the server here
exports.default = app;
