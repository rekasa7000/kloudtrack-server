import { createMultiStationMqttService } from "../../core/services/mqtt.service";

const mqttService = createMultiStationMqttService();


export class StationService {
    static async requestActivation(stationId: number, activationKey: string): Promise<boolean> {
        const topic = `kloudtrack/${stationId}/activation`;
        const message = {
            action: "activate",
            key: activationKey,
        };
        const result = await mqttService.publish(topic, message);
        if (result as any === false) {
            return false;
        }
        
        return true;
    }

    static async requestDeactivation(stationId: number, deactivationKey: string): Promise<boolean> {
        const topic = `kloudtrack/${stationId}/activation`;
        const message = {
            action: "deactivate",
            key: deactivationKey,
        };
        const result = await mqttService.publish(topic, message);
        if (result as any === false) {
            return false;
        }
        return true;
    }
}