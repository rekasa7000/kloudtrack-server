import { PrismaClient } from "@prisma/client";
import logger from "../../../core/utils/logger";
import { calculateHeatIndex, calculateUvIndex } from "./telemetry.utils";

const prisma = new PrismaClient();

export type WeatherTelemetry = {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDirection?: number;
  precipitation?: number;
  lightIntensity?: number;
  uvIntensity?: number;
  distance?: number;
  recordedAt?: Date;
  stationId: number;
};

export async function saveTelemetryData(data: WeatherTelemetry): Promise<void> {
  try {
    const heatIndex =
      data.humidity && data.temperature
        ? calculateHeatIndex(data.humidity, data.temperature)
        : null;

    const uvIndex =
      data.uvIntensity !== undefined ? calculateUvIndex(data.uvIntensity) : 0;

    await prisma.telemetry.create({
      data: {
        stationId: data.stationId,
        recordedAt: data.recordedAt || new Date(),
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        precipitation: data.precipitation,
        lightIntensity: data.lightIntensity,
        distance: data.distance,
        uvIndex: uvIndex,
        heatIndex: heatIndex,
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

export async function getLatestTelemetry(
  stationId: number
): Promise<WeatherTelemetry | null> {
  try {
    const latestData = await prisma.telemetry.findFirst({
      where: {
        stationId: stationId,
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

    if (!latestData) {
      return null;
    }

    return {
      stationId: latestData.stationId,
      recordedAt: latestData.recordedAt,
      ...(latestData.temperature && { temperature: latestData.temperature }),
      ...(latestData.humidity && { humidity: latestData.humidity }),
      ...(latestData.pressure && { pressure: latestData.pressure }),
      ...(latestData.windSpeed && { windSpeed: latestData.windSpeed }),
      ...(latestData.windDirection && {
        windDirection: latestData.windDirection,
      }),
      ...(latestData.precipitation && {
        precipitation: latestData.precipitation,
      }),
      ...(latestData.lightIntensity && {
        lightIntensity: latestData.lightIntensity,
      }),
      ...(latestData.uvIndex && { uvIndex: latestData.uvIndex }),
      ...(latestData.heatIndex && { heatIndex: latestData.heatIndex }),
      ...(latestData.distance && { distance: latestData.distance }),
    };
  } catch (error) {
    logger.error(
      `Failed to get latest telemetry for station ${stationId}:`,
      error
    );
    throw error;
  }
}

export async function getHistoricalTelemetry(
  stationId: number,
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<WeatherTelemetry[]> {
  try {
    const data = await prisma.telemetry.findMany({
      where: {
        stationId: stationId,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        recordedAt: "desc",
      },
      take: limit,
    });

    return data.map((item) => ({
      stationId: item.stationId,
      recordedAt: item.recordedAt,
      ...(item.temperature && { temperature: item.temperature }),
      ...(item.humidity && { humidity: item.humidity }),
      ...(item.pressure && { pressure: item.pressure }),
      ...(item.windSpeed && { windSpeed: item.windSpeed }),
      ...(item.windDirection && {
        windDirection: item.windDirection,
      }),
      ...(item.precipitation && {
        precipitation: item.precipitation,
      }),
      ...(item.lightIntensity && {
        lightIntensity: item.lightIntensity,
      }),
      ...(item.uvIndex && { uvIndex: item.uvIndex }),
      ...(item.heatIndex && { heatIndex: item.heatIndex }),
      ...(item.distance && { distance: item.distance }),
    }));
  } catch (error) {
    logger.error(
      `Failed to get historical telemetry for station ${stationId}:`,
      error
    );
    throw error;
  }
}

export async function getAggregatedTelemetry(
  stationId: string,
  startDate: Date,
  endDate: Date,
  interval: "hourly" | "daily" | "weekly" = "daily"
): Promise<any[]> {
  if (interval === "daily") {
    const result = await prisma.$queryRaw`
      SELECT 
        DATE(recordedAt) as date,
        AVG(temperature) as avgTemperature,
        AVG(humidity) as avgHumidity,
        AVG(pressure) as avgPressure,
        AVG(windSpeed) as avgWindSpeed
      FROM "telemetry"
      WHERE "stationId" = ${stationId}
        AND recordedAt >= ${startDate}
        AND recordedAt <= ${endDate}
      GROUP BY DATE(recordedAt)
      ORDER BY date DESC
    `;

    return result as any[];
  }

  throw new Error(`Aggregation interval '${interval}' not implemented`);
}

export default {
  saveTelemetryData,
  getLatestTelemetry,
  getHistoricalTelemetry,
  getAggregatedTelemetry,
};
