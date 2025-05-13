interface MqttStation {
  keyPath: string;
  certPath: string;
  caPath: string;
  stationName: string;
  host: string;
  port?: number;
  protocol?: "mqtts" | "wss" | undefined;
  reconnectPeriod?: number;
  stationId: number;
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

interface TokenPayload {
  userId: number;
  iat: number;
  exp: number;
}

interface RouteDef {
  method: "get" | "post" | "put" | "delete";
  path: string;
  handler: any;
}
