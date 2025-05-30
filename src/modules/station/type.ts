import { StationType } from "@prisma/client";

export interface CreateStationDTO {
  stationName: string;
  stationType: StationType;
  location: any;
  address: string;
  city: string;
  state: string;
  country: string;
  elevation?: number;
  stationPicture?: string;
  firmwareId: number;
  organizationId?: number;
}

export interface InternalCreateStationDTO extends CreateStationDTO {
  serialCode: string;
  isActive: boolean;
  createdByUserId: number;
}

export interface UpdateStationDTO {
  stationName?: string;
  stationType?: StationType;
  location?: any;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  elevation?: number;
  stationPicture?: string;
  firmwareId?: number;
  isActive?: boolean;
}
