import path from "path";
import { CERTIFICATE_DIR } from "./certificate.config";
import config from "./environment.config";

export const createStationConfig = (
  stationId: string,
  host: string = config.AMAZON_HOST
): MqttStation => {
  return {
    keyPath: path.resolve(
      __dirname,
      `${CERTIFICATE_DIR}/${stationId}/${stationId}-private.pem.key`
    ),
    certPath: path.resolve(
      __dirname,
      `${CERTIFICATE_DIR}/${stationId}/${stationId}-certificate.pem.crt`
    ),
    caPath: path.resolve(__dirname, `${CERTIFICATE_DIR}/AmazonRootCA1.pem`),
    clientId: `server-${stationId}-${Math.random()
      .toString(16)
      .substring(2, 10)}`,
    host: host,
    port: 8883,
    protocol: "mqtts",
    reconnectPeriod: 10000,
    stationId: stationId,
  };
};
