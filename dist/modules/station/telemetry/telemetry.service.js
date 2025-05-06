"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTelemetryData = saveTelemetryData;
exports.getLatestTelemetry = getLatestTelemetry;
exports.getHistoricalTelemetry = getHistoricalTelemetry;
exports.getAggregatedTelemetry = getAggregatedTelemetry;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../../core/utils/logger"));
const telemetry_utils_1 = require("./telemetry.utils");
const prisma = new client_1.PrismaClient();
async function saveTelemetryData(data) {
    try {
        const heatIndex = data.humidity && data.temperature
            ? (0, telemetry_utils_1.calculateHeatIndex)(data.humidity, data.temperature)
            : null;
        const uvIndex = data.uvIntensity !== undefined ? (0, telemetry_utils_1.calculateUvIndex)(data.uvIntensity) : 0;
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
        logger_1.default.info(`Telemetry data saved for station ${data.stationId}`);
    }
    catch (error) {
        logger_1.default.error(`Failed to save telemetry data for station ${data.stationId}:`, error);
        throw error;
    }
}
async function getLatestTelemetry(stationId) {
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
    }
    catch (error) {
        logger_1.default.error(`Failed to get latest telemetry for station ${stationId}:`, error);
        throw error;
    }
}
async function getHistoricalTelemetry(stationId, startDate, endDate, limit = 100) {
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
    }
    catch (error) {
        logger_1.default.error(`Failed to get historical telemetry for station ${stationId}:`, error);
        throw error;
    }
}
async function getAggregatedTelemetry(stationId, startDate, endDate, interval = "daily") {
    if (interval === "daily") {
        const result = await prisma.$queryRaw `
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
        return result;
    }
    throw new Error(`Aggregation interval '${interval}' not implemented`);
}
exports.default = {
    saveTelemetryData,
    getLatestTelemetry,
    getHistoricalTelemetry,
    getAggregatedTelemetry,
};
