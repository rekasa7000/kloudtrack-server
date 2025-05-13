import mqtt from "mqtt";
import { config } from "dotenv";
import logger from "../core/utils/logger";

config();

const env = process.env;

const mqttConfig = {
  brokerUrl: env.MQTT_BROKER_URL || "mqtt://localhost:1883",
  clientId:
    env.MQTT_CLIENT_ID ||
    `kloudtrack_server_${Math.random().toString(16).substring(2, 10)}`,
  options: {
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  },
};

export const createMqttClient = () => {
  try {
    const client = mqtt.connect(mqttConfig.brokerUrl, {
      ...mqttConfig.options,
      clientId: mqttConfig.clientId,
    });

    logger.info(`MQTT client connecting to ${mqttConfig.brokerUrl}`);
    return client;
  } catch (error) {
    logger.error("Failed to create MQTT client", error);
    throw error;
  }
};

export default mqttConfig;
