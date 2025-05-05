import { Request, Response } from "express";
import * as telemetryService from "./telemetry.service";
import logger from "../../../core/utils/logger";

/**
 * Get the latest telemetry data for a station
 * @route GET /api/stations/:stationId/telemetry/latest
 */
export async function getLatestTelemetry(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const data = await telemetryService.getLatestTelemetry(stationId);

    if (!data) {
      return res
        .status(404)
        .json({ message: `No telemetry data found for station ${stationId}` });
    }

    return res.status(200).json(data);
  } catch (error) {
    logger.error("Error getting latest telemetry data:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve telemetry data" });
  }
}

/**
 * Get historical telemetry data for a station
 * @route GET /api/stations/:stationId/telemetry/history
 */
export async function getHistoricalTelemetry(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const { startDate, endDate, limit } = req.query;

    // Validate and parse query parameters
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24h ago
    const end = endDate ? new Date(endDate as string) : new Date(); // Default: now
    const recordLimit = limit ? parseInt(limit as string) : 100; // Default: 100 records

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const data = await telemetryService.getHistoricalTelemetry(
      stationId,
      start,
      end,
      recordLimit
    );

    return res.status(200).json(data);
  } catch (error) {
    logger.error("Error getting historical telemetry data:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve historical telemetry data" });
  }
}

/**
 * Get aggregated telemetry data (e.g., daily averages)
 * @route GET /api/stations/:stationId/telemetry/aggregated
 */
export async function getAggregatedTelemetry(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const { startDate, endDate, interval } = req.query;

    // Validate and parse query parameters
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const end = endDate ? new Date(endDate as string) : new Date(); // Default: now

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Validate interval
    const validInterval =
      interval === "hourly" || interval === "daily" || interval === "weekly"
        ? interval
        : "daily"; // Default to daily if not specified or invalid

    const data = await telemetryService.getAggregatedTelemetry(
      stationId,
      start,
      end,
      validInterval as "hourly" | "daily" | "weekly"
    );

    return res.status(200).json(data);
  } catch (error) {
    logger.error("Error getting aggregated telemetry data:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve aggregated telemetry data" });
  }
}
