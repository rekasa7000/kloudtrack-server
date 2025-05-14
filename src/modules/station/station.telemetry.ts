import { PrismaClient } from "@prisma/client";
import { TelemetryData } from "./station.types";

export class TelemetryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveTelemetry(telemetryData: TelemetryData): Promise<void> {
    try {
      await this.prisma.telemetry.create({
        data: {
          stationId: telemetryData.stationId,
          temperature: telemetryData.temperature,
          humidity: telemetryData.humidity,
          pressure: telemetryData.pressure,
          heatIndex: telemetryData.heatIndex,
          windDirection: telemetryData.windDirection,
          windSpeed: telemetryData.windSpeed,
          precipitation: telemetryData.precipitation,
          uvIndex: telemetryData.uvIndex,
          distance: telemetryData.distance,
          lightIntensity: telemetryData.lightIntensity,
          recordedAt: telemetryData.recordedAt,
        },
      });
    } catch (error) {
      console.error("Error saving telemetry data:", error);
      throw error;
    }
  }
}
