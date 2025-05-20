import { Prisma } from "@prisma/client";
import { AppError } from "../../core/utils/error";
import { TelemetryRepository } from "./repository";

export class TelemetryService {
  private repository: TelemetryRepository;

  constructor(telemetryRepository: TelemetryRepository) {
    this.repository = telemetryRepository;
  }

  async createTelemetry(data: Prisma.TelemetryUncheckedCreateInput) {
    try {
      const telemetry = await this.repository.create(data);
      return telemetry;
    } catch (error) {
      console.error("Error saving Telemetry:", error);
      throw new AppError("Error saving Telemetry", 500);
    }
  }

  async updateTelemetry(telemetryId: number, data: Prisma.TelemetryUncheckedUpdateInput) {
    try {
      const updatedCommand = await this.repository.update(telemetryId, data);
      return updatedCommand;
    } catch (error) {
      console.error(`Error updating Telemetry executed status for ID ${telemetryId}:`, error);
      throw new AppError(`Error updating Telemetry executed status for ID ${telemetryId}`, 500);
    }
  }

  async deleteTelemetry(telemetryId: number) {
    try {
      const deletedCommand = await this.repository.delete(telemetryId);
      return deletedCommand;
    } catch (error) {
      console.error(`Error updating Telemetry executed status for ID ${telemetryId}:`, error);
      throw new AppError(`Error updating Telemetry executed status for ID ${telemetryId}`, 500);
    }
  }

  async findManyTelemetry(stationId: number, take: number | undefined, skip: number | undefined) {
    try {
      const station = await this.repository.findStationById(stationId);

      if (!station) {
        throw new AppError("Station not found", 404);
      }

      const telemetryData = await this.repository.findMany(stationId, take, skip);
      const filteredTelemetryData = telemetryData.map((telemetry) => {
        return {
          recordedAt: telemetry.recordedAt,
          heatIndex: telemetry.heatIndex,
          temperature: telemetry.temperature,
          humidity: telemetry.humidity,
          pressure: telemetry.pressure,
          wind: {
            direction: telemetry.windDirection,
            speed: telemetry.windSpeed,
          },
          precipitation: telemetry.precipitation,
          uvIndex: telemetry.uvIndex,
          distance: telemetry.distance,
          light: telemetry.lightIntensity,
        };
      });
      const data = { station, data: filteredTelemetryData };
      return data;
    } catch (error) {
      console.error(`Error getting Telemetrys:`, error);
      throw new AppError(`Error getting Telemetrys`, 500);
    }
  }

  async findById(telemetryId: number) {
    try {
      const telemetryData = await this.repository.findById(telemetryId);
      return telemetryData;
    } catch (error) {
      console.error(`Error getting Telemetrys:`, error);
      throw new AppError(`Error getting Telemetrys`, 500);
    }
  }
}
