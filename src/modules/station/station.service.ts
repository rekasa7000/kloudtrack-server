import { PrismaClient, Station } from "@prisma/client";
import { StationConfig } from "./station.types";

export class StationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getStationById(stationId: number): Promise<Station | null> {
    try {
      return await this.prisma.station.findUnique({
        where: { id: stationId },
      });
    } catch (error) {
      console.error(`Error getting station by ID ${stationId}:`, error);
      throw error;
    }
  }

  async getAllActiveStations(): Promise<Station[]> {
    try {
      return await this.prisma.station.findMany({
        where: { isActive: true },
      });
    } catch (error) {
      console.error("Error getting all active stations:", error);
      throw error;
    }
  }

  async getStationConfig(stationId: number): Promise<StationConfig> {
    try {
      const station = await this.prisma.station.findUnique({
        where: { id: stationId },
      });

      if (!station) {
        throw new Error(`Station with ID ${stationId} not found`);
      }

      return {
        stationId: station.id,
        serialCode: station.serialCode,
        stationType: station.stationType,
        awsThingName: `station-${station.serialCode}`,
      };
    } catch (error) {
      console.error(`Error getting station config for ID ${stationId}:`, error);
      throw error;
    }
  }

  async getAllStationConfigs(): Promise<StationConfig[]> {
    try {
      const stations = await this.prisma.station.findMany({
        where: { isActive: true },
      });

      return stations.map((station) => ({
        stationId: station.id,
        serialCode: station.serialCode,
        stationType: station.stationType,
        awsThingName: `station-${station.serialCode}`,
      }));
    } catch (error) {
      console.error("Error getting all station configs:", error);
      throw error;
    }
  }
}
