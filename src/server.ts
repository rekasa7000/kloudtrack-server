import app from "./app";
import config from "./config/environment.config";
import logger from "./core/utils/logger";
import { initializeTelemetryService } from "./modules/station/telemetry/telemetry.setup";

async function initializeApp() {
  try {
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

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
