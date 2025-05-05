import app from "./app";
import config from "./config/environment.config";
import logger from "./core/utils/logger";
import { setupMqttService } from "./core/services/station.service";
import { initializeTelemetryService } from "./modules/station/telemetry/telemetry.setup";

async function initializeApp() {
  try {
    // Initialize telemetry (MQTT) service
    await initializeTelemetryService();
    logger.info("Application services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application services:", error);
    process.exit(1);
  }
}
const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);

  initializeApp();
});

(async () => {
  try {
    const mqttService = await setupMqttService();

    if (mqttService) {
      logger.info("MQTT service initialized successfully");
      app.locals.mqttService = mqttService;
    } else {
      logger.warn(
        "MQTT service initialization failed, server will run without MQTT functionality"
      );
    }
  } catch (error) {
    logger.error(`Failed to initialize MQTT service: ${error}`);
    logger.warn("Server will continue running without MQTT functionality");
  }
})();

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
