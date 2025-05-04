interface MqttStation {
  keyPath: string;
  certPath: string;
  caPath: string;
  clientId: string;
  host: string;
  port?: number;
  protocol?: "mqtts" | "wss" | undefined;
  reconnectPeriod?: number;
  stationId: string;
}

interface StationData {
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
  };
}

interface PublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
}
