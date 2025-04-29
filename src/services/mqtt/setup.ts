import prisma from "../../config/db";
import { createStationConfig } from "../../config/mqtt";
import logger from "../../utils/logger";
import { createMultiStationMqttService } from "./service";

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

  mqttService.subscribe("Kloudtrack/weather/data", (message: StationData) => {
    console.log(message.weather.temperature);
  });

  mqttService.on("message", async ({ stationId, topic, message }) => {
    try {
      logger.info(`Message received from ${stationId} on topic ${topic}`);
      console.log("station id: ", stationId);
      console.log("topic: ", topic);
      console.log("payload: ", message);
      const payloadStr = message.toString();
      const data = JSON.parse(payloadStr);

      if (!data.temperature || !data.humidity) {
        logger.warn(`Invalid payload from station ${stationId}:`, data);
        return;
      }

      logger.info(`Data saved for station ${stationId}`);
    } catch (error) {
      logger.error(`Failed to process message from ${stationId}:`, error);
    }
  });

  // * LOGIC HERE

  // default handlers
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
