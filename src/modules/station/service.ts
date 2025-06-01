import { StationRepository } from "./repository";
import { Station, StationType } from "@prisma/client";
import { logger } from "../../core/utils/logger";
import { CreateStationDTO, UpdateStationDTO } from "./type";
import { IoTManager } from "../iot/service";

export class StationService {
  private repository: StationRepository;
  private iotManager?: IoTManager;

  constructor(stationRepository: StationRepository) {
    this.repository = stationRepository;
  }

  public setIoTManager(iotManager: IoTManager): void {
    this.iotManager = iotManager;
  }

  async createStation(data: CreateStationDTO, userId: number): Promise<Station> {
    const station = await this.repository.create(data, userId);

    logger.info(`Station created: ${station.stationName} (ID: ${station.id})`);
    await this.checkAndConnectStation(station.id);
    return station;
  }

  async getAllStations(
    skip: number = 1,
    limit: number = 10
  ): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
  }> {
    const data = await this.repository.findAll(skip, limit);

    return {
      stations: data.stations,
      total: data.total,
      totalPages: Math.ceil(data.total / limit),
    };
  }

  async getActiveStations(): Promise<Station[]> {
    return await this.repository.findActive();
  }

  async updateStation(id: number, data: UpdateStationDTO): Promise<Station> {
    const station = await this.repository.update(id, data);

    logger.info(`Station updated: ${station.stationName} (ID: ${station.id})`);

    if (station.isActive !== undefined) {
      await this.checkAndConnectStation(station.id);
    }
    return station;
  }

  async activateStation(id: number): Promise<Station> {
    const station = await this.repository.activateStation(id);

    logger.info(`Station activated: ${station.stationName} (ID: ${station.id})`);
    return station;
  }

  async deactivateStation(id: number): Promise<Station> {
    const station = await this.repository.deactivateStation(id);

    logger.info(`Station deactivated: ${station.stationName} (ID: ${station.id})`);
    return station;
  }

  async updateStationStatus(id: number, status: any): Promise<void> {
    if (status.firmwareVersion) {
      await this.repository.updateStatus(id, status);
    }

    logger.debug(`Station status updated for station ${id}`);
  }

  async getStationById(id: number) {
    return await this.repository.findById(id);
  }

  async getStationBySerialCode(serialCode: string): Promise<Station | null> {
    return this.repository.findBySerial(serialCode);
  }

  async deleteStation(id: number): Promise<void> {
    await this.repository.delete(id);

    logger.info(`Station deleted: ID ${id}`);
  }

  async getStationsByOrganization(organizationId: number): Promise<Station[]> {
    return await this.repository.findByOrganization(organizationId);
  }

  async addToOrganization(stationId: number, organizationId: number) {}

  public async checkAndConnectStation(stationId: number): Promise<void> {
    if (!this.iotManager) {
      logger.warn("IoT Manager not available");
      return;
    }

    try {
      const station = await this.getStationById(stationId);

      if (!station) {
        logger.warn(`Station ${stationId} not found`);
        return;
      }

      const shouldBeConnected = station.certificate;
      const currentlyConnected = this.iotManager.getConnectionStatus(stationId)?.isConnected || false;

      if (shouldBeConnected && !currentlyConnected) {
        await this.iotManager.connectStation(stationId);
        logger.info(`Station ${stationId} connected to IoT`);
      } else if (!shouldBeConnected && currentlyConnected) {
        await this.iotManager.disconnectStation(stationId);
        logger.info(`Station ${stationId} disconnected from IoT`);
      }
    } catch (error) {
      logger.error(`Failed to manage IoT connection for station ${stationId}:`, error);
    }
  }
}
