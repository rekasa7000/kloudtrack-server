import path from "path";
import { StationConfig } from "../station.types";

const DEFAULT_AWS_IOT_CONFIG = {
  host: process.env.AWS_IOT_HOST || "",
  port: parseInt(process.env.AWS_IOT_PORT || "8883"),
  protocol: (process.env.AWS_IOT_PROTOCOL as "mqtts" | "wss") || "mqtts",
  reconnectPeriod: parseInt(process.env.AWS_IOT_RECONNECT_PERIOD || "5000"),
};

const CERT_DIR =
  process.env.CERT_DIR || path.join(process.cwd(), "certificates");

export function createStationConfig(props: StationConfig): MqttStation {
  const certPath = path.isAbsolute(props.certPath)
    ? props.certPath
    : path.join(CERT_DIR, props.certPath);

  const keyPath = path.isAbsolute(props.keyPath)
    ? props.keyPath
    : path.join(CERT_DIR, props.keyPath);

  const caPath = path.isAbsolute(props.caPath)
    ? props.caPath
    : path.join(CERT_DIR, props.caPath);

  return {
    stationName: props.stationName,
    stationId: props.stationId,
    certPath,
    keyPath,
    caPath,
    ...DEFAULT_AWS_IOT_CONFIG,
  };
}
