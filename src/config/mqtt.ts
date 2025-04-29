import path from "path";
import { MqttStation } from "../types/mqtt.type";
import { getCertificateDir } from "../utils/certificate";

export function createStationConfig(
  stationId: string,
  certificateDir: string = getCertificateDir(),
  host: string = "a68bn74ibyvu1-ats.iot.ap-southeast-1.amazonaws.com"
): MqttStation {
  return {
    keyPath: path.resolve(
      __dirname,
      `${certificateDir}/${stationId}/${stationId}-private.pem.key`
    ),
    certPath: path.resolve(
      __dirname,
      `${certificateDir}/${stationId}/${stationId}-certificate.pem.crt`
    ),
    caPath: path.resolve(__dirname, `${certificateDir}/AmazonRootCA1.pem`),
    clientId: `server-${stationId}-${Math.random()
      .toString(16)
      .substring(2, 10)}`,
    host: host,
    port: 8883,
    protocol: "mqtts",
    reconnectPeriod: 10000,
    stationId: stationId,
  };
}
