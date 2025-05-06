"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_config_1 = __importDefault(require("./config/environment.config"));
const logger_1 = __importDefault(require("./core/utils/logger"));
const telemetry_setup_1 = require("./modules/station/telemetry/telemetry.setup");
async function initializeApp() {
    try {
        await (0, telemetry_setup_1.initializeTelemetryService)();
        logger_1.default.info("Application services initialized successfully");
    }
    catch (error) {
        logger_1.default.error("Failed to initialize application services:", error);
        process.exit(1);
    }
}
const server = app_1.default.listen(environment_config_1.default.PORT, () => {
    logger_1.default.info(`Server running on port ${environment_config_1.default.PORT}`);
    initializeApp();
});
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        logger_1.default.info("HTTP server closed");
    });
});
