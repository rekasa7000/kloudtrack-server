import { PrismaClient } from "@prisma/client";
import logger from "../../../core/utils/logger";
import mqttService from "./telemetry.mqtt";
import { saveTelemetryData, WeatherTelemetry } from "./telemetry.service";
import { createStationConfig } from "../../../config/station.config";

const prisma = new PrismaClient();

/**
 * Initialize the MQTT service for telemetry data collection
 */
export async function initializeTelemetryService(): Promise<void> {
  try {
    // Get all active stations from the database
    const stations = await prisma.station.findMany({
      where: {
        active: true,
      },
      include: {
        certificates: true,
      },
    });

    logger.info(`Setting up MQTT for ${stations.length} active stations`);

    // Add each station to the MQTT service
    for (const station of stations) {
      // Skip stations without certificates
      if (!station.certificates || station.certificates.length === 0) {
        logger.warn(
          `Station ${station.stationId} has no certificates. Skipping.`
        );
        continue;
      }

      // Use the latest certificate
      const latestCert = station.certificates.reduce((latest, cert) => {
        return latest.createdAt > cert.createdAt ? latest : cert;
      });

      // Create station config from certificate data
      const config = createStationConfig({
        stationId: station.stationId,
        clientId: latestCert.clientId,
        certPath: latestCert.certPath,
        keyPath: latestCert.keyPath,
        caPath: latestCert.caPath,
      });

      // Add station to MQTT service
      mqttService.addStation(config);

      logger.info(`Added station ${station.stationId} to MQTT service`);
    }

    // Connect all stations
    await mqttService.connectAll();
    logger.info("All stations connected to MQTT service");

    // Subscribe to telemetry topics for all stations
    mqttService.on("message", processIncomingMessage);

    // Subscribe to specific telemetry topics
    stations.forEach((station) => {
      // Subscribe to telemetry data topic
      mqttService.subscribe(
        `devices/${station.stationId}/data`,
        telemetryHandler,
        station.stationId
      );

      // Subscribe to wildcard for all device data for this station
      mqttService.subscribe(
        `devices/+/data`,
        telemetryHandler,
        station.stationId
      );
    });

    // Setup reconnection handlers
    mqttService.on("reconnect", (stationId) => {
      logger.info(`MQTT client for station ${stationId} reconnecting`);
    });

    mqttService.on("offline", (stationId) => {
      logger.warn(`MQTT client for station ${stationId} is offline`);
    });

    mqttService.on("error", (error, stationId) => {
      logger.error(`MQTT client error for station ${stationId}:`, error);
    });

    logger.info("Telemetry service initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize telemetry service:", error);
    throw error;
  }
}

/**
 * Process incoming MQTT messages
 */
function processIncomingMessage({
  topic,
  message,
  stationId,
}: {
  topic: string;
  message: any;
  stationId: string;
}): void {
  // Check if this is a telemetry data message
  if (topic.includes("/data")) {
    telemetryHandler(message, stationId);
  }
}

/**
 * Handle telemetry data from weather stations
 */
async function telemetryHandler(
  message: any,
  stationId: string
): Promise<void> {
  try {
    // Validate message format
    if (!message || !message.weather) {
      logger.warn(`Invalid telemetry data format from station ${stationId}`);
      return;
    }

    const weather = message.weather;

    // Create telemetry data object
    const telemetryData: WeatherTelemetry = {
      stationId: stationId,
      deviceId: message.deviceId || "unknown",
      temperature: weather.temperature,
      humidity: weather.humidity,
      pressure: weather.pressure,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      rainfall: weather.rainfall,
      solarRadiation: weather.solarRadiation,
      uvIndex: weather.uvIndex,
      timestamp: new Date(),
    };

    // Save telemetry data to database
    await saveTelemetryData(telemetryData);

    logger.debug(`Telemetry data saved for station ${stationId}`);
  } catch (error) {
    logger.error(`Failed to process telemetry data from ${stationId}:`, error);
  }
}

export default {
  initializeTelemetryService,
};
