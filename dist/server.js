"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_config_1 = __importDefault(require("./config/environment.config"));
const logger_1 = __importDefault(require("./core/utils/logger"));
const station_service_1 = require("./core/services/station.service");
const server = app_1.default.listen(environment_config_1.default.PORT, () => {
    logger_1.default.info(`Server running on port ${environment_config_1.default.PORT}`);
});
(async () => {
    try {
        const mqttService = await (0, station_service_1.setupMqttService)();
        if (mqttService) {
            logger_1.default.info("MQTT service initialized successfully");
            app_1.default.locals.mqttService = mqttService;
        }
        else {
            logger_1.default.warn("MQTT service initialization failed, server will run without MQTT functionality");
        }
    }
    catch (error) {
        logger_1.default.error(`Failed to initialize MQTT service: ${error}`);
        logger_1.default.warn("Server will continue running without MQTT functionality");
    }
})();
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        logger_1.default.info("HTTP server closed");
    });
});
