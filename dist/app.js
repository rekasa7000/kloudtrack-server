"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
const cors_middleware_1 = require("./middleware/cors.middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use(cors_middleware_1.customCors);
app.options(/(.*)/, (0, cors_1.default)(cors_middleware_1.corsOptions));
app.use(express_1.default.json());
app.use(routes_1.default);
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
app.use(error_handler_middleware_1.errorHandler);
exports.default = app;
