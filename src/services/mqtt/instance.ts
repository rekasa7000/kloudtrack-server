import { setupMqttService } from "./setup";
import {
  MultiStationMqttService,
  PublishOptions,
  createMultiStationMqttService,
} from "./service";

export { setupMqttService };

export {
  MultiStationMqttService,
  PublishOptions,
  createMultiStationMqttService,
};

let mqttServiceInstance: MultiStationMqttService | undefined;

export async function getMqttService(): Promise<MultiStationMqttService> {
  if (!mqttServiceInstance) {
    mqttServiceInstance = await setupMqttService();
  }
  return mqttServiceInstance;
}

export default {
  setupMqttService,
  getMqttService,
  createMultiStationMqttService,
};
