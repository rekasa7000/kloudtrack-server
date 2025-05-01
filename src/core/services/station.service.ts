import { createStationConfig } from "../../config/mqtt.config";
import logger from "../utils/logger";
import { createMultiStationMqttService } from "./mqtt.service";

const mqttService = createMultiStationMqttService();

type StationData = {
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
  };
};

export const setupMqttService = async () => {
  // const stations = await prisma.station.findMany();

  // stations.map((station) => {
  //   mqttService.addStation(createStationConfig(station.stationName));
  // });

  mqttService.addStation(createStationConfig("test"));

  await mqttService.connectAll();

  // mqttService.subscribe("kloudtrack/KTB61815AC/command", (message) => {
  //   console.log(message);
  // });
  // mqttService.publish("kloudtrack/KTB61815AC/command", {
  //   command: "status",
  // });

  //  mqttService.subscribe("kloudtrack/KTB61815AC/data", (message) => {
  //   console.log(message);
  // });

  mqttService.on("message", async ({ stationId, topic, message }) => {
    try {
      logger.info(`Message received from ${stationId} on topic ${topic}`);
      logger.info(`Data saved for station ${stationId}`);
    } catch (error) {
      logger.error(`Failed to process message from ${stationId}:`, error);
    }
  });

  mqttService.on("reconnect", (stationId) => {
    logger.info(`MQTT client for station ${stationId} reconnecting`);
  });

  mqttService.on("offline", (stationId) => {
    logger.warn(`MQTT client for station ${stationId} is offline`);
  });

  mqttService.on("error", (error, stationId) => {
    logger.error(`MQTT client error for station ${stationId}:`, error);
  });

  mqttService.publish("devices/device123/control", { command: "ON" });

  return mqttService;
};
