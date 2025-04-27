import { MqttService, createMqttService } from "./service";
import { mqttConfig } from "../../config/mqtt";

export const mqttService = createMqttService(mqttConfig);

export type { MqttService };
