import { Prisma } from "@prisma/client";
import { AppError } from "../../core/utils/error";
import { TelemetryRepository } from "./repository";

export class TelemetryService {
  private repository: TelemetryRepository;

  constructor(telemetryRepository: TelemetryRepository) {
    this.repository = telemetryRepository;
  }

  async createTelemetry(stationId: number, data: Prisma.TelemetryUncheckedCreateInput) {
    const telemetry = await this.repository.create(stationId, data);
    return telemetry;
  }

  async updateTelemetry(telemetryId: number, data: Prisma.TelemetryUncheckedUpdateInput) {
    const updatedCommand = await this.repository.update(telemetryId, data);
    return updatedCommand;
  }

  async deleteTelemetry(telemetryId: number) {
    const deletedCommand = await this.repository.delete(telemetryId);
    return deletedCommand;
  }

  async findManyTelemetry(stationId: number, take: number | undefined, skip: number | undefined) {
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
  }

  async findById(telemetryId: number) {
    const telemetryData = await this.repository.findById(telemetryId);
    return telemetryData;
  }
}
