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
const logger_1 = __importDefault(require("./utils/logger"));
const setup_1 = require("./services/mqtt/setup");
const config_1 = __importDefault(require("./config/config"));
const app = (0, express_1.default)();
// middleware
app.use(cors_middleware_1.customCors);
app.options(/(.*)/, (0, cors_1.default)(cors_middleware_1.corsOptions));
app.use(express_1.default.json());
// routes
app.use(routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
// error handler
app.use(error_handler_middleware_1.errorHandler);
(async () => {
    try {
        const mqttService = await (0, setup_1.setupMqttService)();
        logger_1.default.info("MQTT service initialized successfully");
        app.locals.mqttService = mqttService;
        app.listen(config_1.default.PORT, () => {
            logger_1.default.info(`Server running on port ${config_1.default.PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error("Failed to initialize MQTT service:", error);
        process.exit(1);
    }
})();
exports.default = app;
