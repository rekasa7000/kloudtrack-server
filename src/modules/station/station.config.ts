import path from "path";
import { StationConfig } from "./station.types";
import { DEFAULT_AWS_IOT_CONFIG } from "../../config/aws.config";

export function createStationConfig(props: StationConfig): MqttStation {
  const certPath = path.join(process.cwd(), props.certPath);
  const keyPath = path.join(process.cwd(), props.keyPath);
  const caPath = props.caPath;

  return {
    stationName: props.stationName,
    stationId: props.stationId,
    certPath,
    keyPath,
    caPath,
    ...DEFAULT_AWS_IOT_CONFIG,
  };
}
