import { StationType } from "@prisma/client";

export interface StationMetadata {
  stationName: string;
  stationType: StationType;
  location: string;
  barangay: string;
  city: string;
  province: string;
  country: string;
  serialCode: string;
  elevation: number;
  stationPicture: string;
  isActive: boolean;
  activatedAt: string;
  firmwareVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  keyPath: string;
  certPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface StationLookup {
  serialCode?: string;
  stationId?: number;
  stationName?: string;
}

export interface StationConfig {
  stationId: number;
  serialCode: string;
  stationType: string;
  awsThingName: string;
}

export interface MqttMessage {
  topic: string;
  payload: any;
}

export interface TelemetryData {
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

export interface CommandData {
  stationId: number;
  command: Record<string, any>;
  issuedBy: number;
}
