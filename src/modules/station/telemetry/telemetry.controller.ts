import { Request, Response } from "express";
import * as telemetryService from "./telemetry.service";
import logger from "../../../core/utils/logger";

export async function getLatestTelemetry(req: Request, res: Response) {
  try {
    const stationId = +req.params.stationId;
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

export async function getHistoricalTelemetry(req: Request, res: Response) {
  try {
    const stationId = +req.params.stationId;
    const { startDate, endDate, limit } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const recordLimit = limit ? parseInt(limit as string) : 100;

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

export async function getAggregatedTelemetry(req: Request, res: Response) {
  try {
    const { stationId } = req.params;
    const { startDate, endDate, interval } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const validInterval =
      interval === "hourly" || interval === "daily" || interval === "weekly"
        ? interval
        : "daily";

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
