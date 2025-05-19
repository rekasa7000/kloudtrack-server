import { Prisma, PrismaClient } from "@prisma/client";
import { TelemetryData } from "../station.types";
import { AppError } from "../../../core/utils/error";
import { TelemetryRepository } from "./telemetry.repository";

export class TelemetryService {
  private TelemetryRepository: TelemetryRepository;

  constructor(telemetryRepository: TelemetryRepository) {
    this.TelemetryRepository = telemetryRepository;
  }

  async createTelemetry(data: TelemetryData) {
    try {
      const Telemetry = await this.TelemetryRepository.create(data);
      return Telemetry;
    } catch (error) {
      console.error("Error saving Telemetry:", error);
      throw new AppError("Error saving Telemetry", 500);
    }
  }

  async updateTelemetry(telemetryId: number, data: Prisma.TelemetryUncheckedUpdateInput) {
    try {
      const updatedCommand = await this.TelemetryRepository.update(telemetryId, data);
      return updatedCommand;
    } catch (error) {
      console.error(`Error updating Telemetry executed status for ID ${telemetryId}:`, error);
      throw new AppError(`Error updating Telemetry executed status for ID ${telemetryId}`, 500);
    }
  }

  async deleteTelemetry(telemetryId: number) {
    try {
      const deletedCommand = await this.TelemetryRepository.delete(telemetryId);
      return deletedCommand;
    } catch (error) {
      console.error(`Error updating Telemetry executed status for ID ${telemetryId}:`, error);
      throw new AppError(`Error updating Telemetry executed status for ID ${telemetryId}`, 500);
    }
  }

  async findAllTelemetry(take: number, skip: number) {
    try {
      const TelemetryData = await this.TelemetryRepository.findAll(take, skip);
      return TelemetryData;
    } catch (error) {
      console.error(`Error getting Telemetrys:`, error);
      throw new AppError(`Error getting Telemetrys`, 500);
    }
  }
  async findCommandByIdTelemetry(telemetryId: number) {
    try {
      const TelemetryData = await this.TelemetryRepository.findById(telemetryId);
      return TelemetryData;
    } catch (error) {
      console.error(`Error getting Telemetrys:`, error);
      throw new AppError(`Error getting Telemetrys`, 500);
    }
  }
}
