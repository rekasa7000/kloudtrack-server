import { Router } from "express";

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

interface IRouteConfig {
  path: string;
  router: Router;
}

interface MulterRequest extends Request {
  body: {
    serialCode?: string;
    version?: string;
  };
}

interface WeatherStationConfig {
  thingName: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

interface WeatherData {
  stationId: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  heatIndex?: number;
  windDirection?: number;
  windSpeed?: number;
  precipitation?: number;
  uvIndex?: number;
  distance?: number;
  lightIntensity?: number;
  recordedAt: Date;
}

interface StationCommand {
  stationId: number;
  commandType: string;
  parameters?: Record<string, any>;
  priority?: "low" | "medium" | "high";
}

interface IoTMessage {
  topic: string;
  payload: any;
  timestamp: Date;
  clientId: string;
}

interface StationConnection {
  stationId: number;
  clientId: string;
  isConnected: boolean;
  lastSeen: Date;
  connectionCount: number;
}
