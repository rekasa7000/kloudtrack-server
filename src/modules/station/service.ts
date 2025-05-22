import { StationRepository } from "./repository";
import { Station, StationType } from "@prisma/client";
import { logger } from "../../core/utils/logger";
import { CreateStationDTO, UpdateStationDTO } from "./type";

export class StationService {
  private repository: StationRepository;

  constructor(stationRepository: StationRepository) {
    this.repository = stationRepository;
  }

  async createStation(data: CreateStationDTO, userId: number): Promise<Station> {
    try {
      const station = await this.repository.create(data, userId);

      logger.info(`Station created: ${station.stationName} (ID: ${station.id})`);
      return station;
    } catch (error) {
      logger.error("Failed to create station:", error);
      throw error;
    }
  }

  async getStationById(id: number) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      logger.error(`Failed to get station ${id}:`, error);
      throw error;
    }
  }

  async getStationBySerialCode(serialCode: string): Promise<Station | null> {
    try {
      return await this.repository.findBySerial(serialCode);
    } catch (error) {
      logger.error(`Failed to get station by serial code ${serialCode}:`, error);
      throw error;
    }
  }

  async getAllStations(
    skip: number = 1,
    limit: number = 10
  ): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
  }> {
    try {
      const data = await this.repository.findAll(skip, limit);

      return {
        stations: data.stations,
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
      };
    } catch (error) {
      logger.error("Failed to get all stations:", error);
      throw error;
    }
  }

  async getActiveStations(): Promise<Station[]> {
    try {
      return await this.repository.findActive();
    } catch (error) {
      logger.error("Failed to get active stations:", error);
      throw error;
    }
  }

  async updateStation(id: number, data: UpdateStationDTO): Promise<Station> {
    try {
      const station = await this.repository.update(id, data);

      logger.info(`Station updated: ${station.stationName} (ID: ${station.id})`);
      return station;
    } catch (error) {
      logger.error(`Failed to update station ${id}:`, error);
      throw error;
    }
  }

  async activateStation(id: number): Promise<Station> {
    try {
      const station = await this.repository.activateStation(id);

      logger.info(`Station activated: ${station.stationName} (ID: ${station.id})`);
      return station;
    } catch (error) {
      logger.error(`Failed to activate station ${id}:`, error);
      throw error;
    }
  }

  async deactivateStation(id: number): Promise<Station> {
    try {
      const station = await this.repository.deactivateStation(id);

      logger.info(`Station deactivated: ${station.stationName} (ID: ${station.id})`);
      return station;
    } catch (error) {
      logger.error(`Failed to deactivate station ${id}:`, error);
      throw error;
    }
  }

  async updateStationStatus(id: number, status: any): Promise<void> {
    try {
      if (status.firmwareVersion) {
        await this.repository.updateStatus(id, status);
      }

      logger.debug(`Station status updated for station ${id}`);
    } catch (error) {
      logger.error(`Failed to update station status ${id}:`, error);
      throw error;
    }
  }

  async deleteStation(id: number): Promise<void> {
    try {
      await this.repository.delete(id);

      logger.info(`Station deleted: ID ${id}`);
    } catch (error) {
      logger.error(`Failed to delete station ${id}:`, error);
      throw error;
    }
  }

  async getStationsByOrganization(organizationId: number): Promise<Station[]> {
    try {
      return await this.repository.findByOrganization(organizationId);
    } catch (error) {
      logger.error(`Failed to get stations by organization ${organizationId}:`, error);
      throw error;
    }
  }
}
