import { StationMetadata } from "../../core/services/station/station.types";
import { StationRepository } from "./repository";
import { AppError } from "../../core/utils/error";

export class StationService {
  private repository: StationRepository;

  constructor(stationRepository: StationRepository) {
    this.repository = stationRepository;
  }

  async getAllStations(skip: number, take: number) {
    return this.repository.getAllStations(skip, take);
  }

  async createStation(data: StationMetadata, userId: number) {
    if (!data) {
      throw new AppError("Station metadata is required", 400);
    }

    return this.repository.createStation(data, userId);
  }

  async updateStation(id: number, data: StationMetadata) {
    const existingStation = await this.repository.getStationById(id);
    if (!existingStation) {
      throw new AppError("Station not found", 404);
    }

    return this.repository.updateStation(id, data);
  }

  async deleteStation(id: number) {
    const existingStation = await this.repository.getStationById(id);
    if (!existingStation) {
      throw new AppError("Station not found", 404);
    }

    return this.repository.deleteStation(id);
  }

  async getStationById(id: number) {
    const station = await this.repository.getStationById(id);
    if (!station) {
      throw new AppError("Station not found", 404);
    }

    return station;
  }
}
