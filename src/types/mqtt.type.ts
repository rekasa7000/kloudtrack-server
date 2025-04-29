export type MqttStation = {
  keyPath: string;
  certPath: string;
  caPath: string;
  clientId: string;
  host: string;
  port?: number;
  protocol?: "mqtts" | "wss";
  reconnectPeriod?: number;
  stationId: string;
};
