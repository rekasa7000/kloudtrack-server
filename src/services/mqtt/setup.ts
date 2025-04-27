import { mqttConfig } from "../../config/mqtt";
import logger from "../../utils/logger";
import { createMqttService } from "./service";

export const mqttService = createMqttService(mqttConfig);

export function setupMqttService() {
  mqttService.subscribe("devices/+/telemetry", (message) => {
    logger.info("Received telemetry data:", message);
    // * TODO: CREATE DATA IN THE DATABSE
  });

  mqttService.subscribe("devices/+/status", (message) => {
    logger.info("Device status update:", message);
  });

  // Connect to AWS IoT Core
  mqttService
    .connect()
    .then(() => {
      logger.info("Successfully connected to AWS IoT Core");
    })
    .catch((error) => {
      logger.error("Failed to connect to AWS IoT Core:", error);
      process.exit(1);
    });

  mqttService.on("reconnect", () => {
    logger.info("MQTT client reconnecting");
  });

  mqttService.on("offline", () => {
    logger.warn("MQTT client is offline");
  });

  mqttService.on("error", (error) => {
    logger.error("MQTT client error:", error);
  });

  return mqttService;
}
