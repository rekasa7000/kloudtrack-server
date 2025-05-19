import { StationMetadata } from "../station.types";
import { MetadataRepository } from "./metadata.repository";
import { AppError } from "../../../core/utils/error";

export class MetadataService {
  private metadataRepository: MetadataRepository;
  constructor(metadataRepository: MetadataRepository) {
    this.metadataRepository = metadataRepository;
  }

  async getAllStations(skip: number, take: number) {
    return this.metadataRepository.getAllStations(skip, take);
  }

  async createStation(data: StationMetadata, userId: number) {
    if (!data) {
      throw new AppError("Station metadata is required", 400);
    }

    return this.metadataRepository.createStation(data, userId);
  }

  async updateStation(id: number, data: StationMetadata) {
    const existingStation = await this.metadataRepository.getStationById(id);
    if (!existingStation) {
      throw new AppError("Station not found", 404);
    }

    return this.metadataRepository.updateStation(id, data);
  }

  async deleteStation(id: number) {
    const existingStation = await this.metadataRepository.getStationById(id);
    if (!existingStation) {
      throw new AppError("Station not found", 404);
    }

    return this.metadataRepository.deleteStation(id);
  }

  async getStationById(id: number) {
    const station = await this.metadataRepository.getStationById(id);
    if (!station) {
      throw new AppError("Station not found", 404);
    }

    return station;
  }
}
