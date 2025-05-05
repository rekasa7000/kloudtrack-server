import app from "./app";
import config from "./config/environment.config";
import logger from "./core/utils/logger";
import { setupMqttService } from "./core/services/station.service";

const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
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
