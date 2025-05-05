import { PrismaClient } from "@prisma/client";
import logger from "../../../core/utils/logger";

const prisma = new PrismaClient();

// Define types for telemetry data
export type WeatherTelemetry = {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  rainfall?: number;
  solarRadiation?: number;
  uvIndex?: number;
  timestamp?: Date;
  deviceId?: string;
  stationId: string;
};

/**
 * Save telemetry data to database
 * @param data The weather telemetry data to save
 */
export async function saveTelemetryData(data: WeatherTelemetry): Promise<void> {
  try {
    // Save to database using Prisma
    await prisma.telemetry.create({
      data: {
        stationId: data.stationId,
        deviceId: data.deviceId || "unknown",
        timestamp: data.timestamp || new Date(),
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        rainfall: data.rainfall,
        solarRadiation: data.solarRadiation,
        uvIndex: data.uvIndex,
        rawData: JSON.stringify(data),
      },
    });

    logger.info(`Telemetry data saved for station ${data.stationId}`);
  } catch (error) {
    logger.error(
      `Failed to save telemetry data for station ${data.stationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get latest telemetry data for a station
 * @param stationId The station ID to get data for
 */
export async function getLatestTelemetry(
  stationId: string
): Promise<WeatherTelemetry | null> {
  try {
    const latestData = await prisma.telemetry.findFirst({
      where: {
        stationId: stationId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!latestData) {
      return null;
    }

    return {
      stationId: latestData.stationId,
      deviceId: latestData.deviceId,
      temperature: latestData.temperature,
      humidity: latestData.humidity,
      pressure: latestData.pressure,
      windSpeed: latestData.windSpeed,
      windDirection: latestData.windDirection,
      rainfall: latestData.rainfall || undefined,
      solarRadiation: latestData.solarRadiation || undefined,
      uvIndex: latestData.uvIndex || undefined,
      timestamp: latestData.timestamp,
    };
  } catch (error) {
    logger.error(
      `Failed to get latest telemetry for station ${stationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get historical telemetry data for a station
 * @param stationId The station ID to get data for
 * @param startDate Start date for the query
 * @param endDate End date for the query
 * @param limit Maximum number of records to return
 */
export async function getHistoricalTelemetry(
  stationId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<WeatherTelemetry[]> {
  try {
    const data = await prisma.telemetry.findMany({
      where: {
        stationId: stationId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    return data.map((item) => ({
      stationId: item.stationId,
      deviceId: item.deviceId,
      temperature: item.temperature,
      humidity: item.humidity,
      pressure: item.pressure,
      windSpeed: item.windSpeed,
      windDirection: item.windDirection,
      rainfall: item.rainfall || undefined,
      solarRadiation: item.solarRadiation || undefined,
      uvIndex: item.uvIndex || undefined,
      timestamp: item.timestamp,
    }));
  } catch (error) {
    logger.error(
      `Failed to get historical telemetry for station ${stationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get aggregated telemetry data (e.g., daily averages)
 * @param stationId The station ID to get data for
 * @param startDate Start date for the query
 * @param endDate End date for the query
 * @param interval Aggregation interval ('daily', 'hourly', etc.)
 */
export async function getAggregatedTelemetry(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: "hourly" | "daily" | "weekly" = "daily"
): Promise<any[]> {
  // This would be implemented with SQL aggregation
  // Using Prisma's $queryRaw or a similar approach

  // Example implementation for daily aggregation
  if (interval === "daily") {
    const result = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        AVG(temperature) as avgTemperature,
        AVG(humidity) as avgHumidity,
        AVG(pressure) as avgPressure,
        AVG(windSpeed) as avgWindSpeed
      FROM "Telemetry"
      WHERE "stationId" = ${stationId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    return result as any[];
  }

  // Implement other intervals as needed
  throw new Error(`Aggregation interval '${interval}' not implemented`);
}

export default {
  saveTelemetryData,
  getLatestTelemetry,
  getHistoricalTelemetry,
  getAggregatedTelemetry,
};
