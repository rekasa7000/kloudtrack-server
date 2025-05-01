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
