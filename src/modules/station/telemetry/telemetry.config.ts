import path from "path";
import { MqttStation } from "../features/station/telemetry/telemetry.mqtt";

/**
 * Default configuration for AWS IoT Core
 */
const DEFAULT_AWS_IOT_CONFIG = {
  host: process.env.AWS_IOT_HOST || "",
  port: parseInt(process.env.AWS_IOT_PORT || "8883"),
  protocol: process.env.AWS_IOT_PROTOCOL || "mqtts",
  reconnectPeriod: parseInt(process.env.AWS_IOT_RECONNECT_PERIOD || "5000"),
};

/**
 * Path to certificates directory
 */
const CERT_DIR =
  process.env.CERT_DIR || path.join(process.cwd(), "certificates");

/**
 * Station configuration props
 */
export type StationConfigProps = {
  stationId: string;
  clientId: string;
  certPath: string;
  keyPath: string;
  caPath: string;
};

/**
 * Creates a station configuration object for MQTT connection
 *
 * @param props The station properties
 * @returns MqttStation configuration object
 */
export function createStationConfig(props: StationConfigProps): MqttStation {
  // If paths are relative, resolve them against the certificate directory
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
    stationId: props.stationId,
    clientId: props.clientId,
    certPath,
    keyPath,
    caPath,
    ...DEFAULT_AWS_IOT_CONFIG,
  };
}

export default {
  createStationConfig,
};
