import { StationType } from "@prisma/client";

export interface CreateStationDTO {
  stationName: string;
  stationType: StationType;
  location: any;
  barangay: string;
  city: string;
  province: string;
  country: string;
  serialCode: string;
  elevation?: number;
  stationPicture?: string;
  firmwareVersion: string;
  createdByUserId: number;
  organizationId?: number;
  isActive: boolean;
}

export interface UpdateStationDTO {
  stationName?: string;
  stationType?: StationType;
  location?: any;
  barangay?: string;
  city?: string;
  province?: string;
  country?: string;
  elevation?: number;
  stationPicture?: string;
  firmwareVersion?: string;
  isActive?: boolean;
}
