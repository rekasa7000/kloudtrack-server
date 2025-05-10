import { PrismaClient } from "@prisma/client";
import logger from "../../../core/utils/logger";
import mqttService from "./telemetry.mqtt";
import { saveTelemetryData, WeatherTelemetry } from "./telemetry.service";
import { createStationConfig } from "../station.config";

const prisma = new PrismaClient();

export const initializeTelemetryService = async (): Promise<void> => {
  try {
    const stations = await prisma.station.findMany({
      where: {
        isActive: true,
      },
      include: {
        certificate: true,
      },
    });

    const rootCertificate = await prisma.rootCertificate.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!rootCertificate) {
      logger.warn(`Root Certificate not found.`);
      return;
    }

    logger.info(`Setting up MQTT for ${stations.length} active stations`);

    for (const station of stations) {
      if (!station.certificate) {
        logger.warn(`Station ${station.id} has no certificates. Skipping.`);
        continue;
      }

      const config = createStationConfig({
        stationId: station.id,
        stationName: station.stationName,
        certPath: station.certificate.certPath,
        keyPath: station.certificate.keyPath,
        caPath: rootCertificate.path,
      });

      mqttService.addStation(config);

      logger.info(`Added station ${station.stationName} to MQTT service`);
    }

    await mqttService.connectAll();
    logger.info("All stations connected to MQTT service");

    mqttService.on("message", processIncomingMessage);

    stations.forEach((station) => {
      mqttService.subscribe(
        `devices/${station.serialCode}/data`,
        telemetryHandler,
        station.id
      );

      mqttService.subscribe(`devices/+/data`, telemetryHandler, station.id);
    });

    mqttService.on("reconnect", (stationName) => {
      logger.info(`MQTT client for station ${stationName} reconnecting`);
    });

    mqttService.on("offline", (stationName) => {
      logger.warn(`MQTT client for station ${stationName} is offline`);
    });

    mqttService.on("error", (error, stationName) => {
      logger.error(`MQTT client error for station ${stationName}:`, error);
    });

    logger.info("Telemetry service initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize telemetry service:", error);
    throw error;
  }
};

const processIncomingMessage = ({
  topic,
  message,
  stationId,
}: {
  topic: string;
  message: any;
  stationId: number;
}): void => {
  if (topic.includes("/data")) {
    telemetryHandler(message, stationId);
  }
};

const telemetryHandler = async (
  message: any,
  stationId: number
): Promise<void> => {
  try {
    if (!message || !message.weather) {
      logger.warn(`Invalid telemetry data format from station ${stationId}`);
      return;
    }

    const weather = message.weather;

    const telemetryData: WeatherTelemetry = {
      stationId: weather.stationId,
      recordedAt: weather.recordedAt || new Date(),
      temperature: weather.temperature,
      humidity: weather.humidity,
      pressure: weather.pressure,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      precipitation: weather.precipitation,
      lightIntensity: weather.lightIntensity,
      distance: weather.distance,
    };

    await saveTelemetryData(telemetryData);

    logger.debug(`Telemetry data saved for station ${stationId}`);
  } catch (error) {
    logger.error(`Failed to process telemetry data from ${stationId}:`, error);
  }
};

export default {
  initializeTelemetryService,
};
