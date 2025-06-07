import { Request, Response } from "express";
import { SystemMetricsService } from "./service";
import { TimeRangeQuery } from "./types";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { AppError } from "../../core/utils/error";

export class SystemMetricsController {
  private healthService: SystemMetricsService;

  constructor(healthService: SystemMetricsService) {
    this.healthService = healthService;
  }

  public getCurrentHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const metrics = await this.healthService.getCurrentMetrics();

    if (!metrics) {
      throw new AppError("No health metrics available", 404);
    }

    res.status(200).json({
      success: true,
      data: metrics,
    });
  });

  public getHealthHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, limit, hours } = req.query;

    const query: TimeRangeQuery = {};

    if (startDate) {
      query.startDate = new Date(startDate as string);
    }

    if (endDate) {
      query.endDate = new Date(endDate as string);
    }

    if (hours) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours as string));
      query.startDate = hoursAgo;
    }

    if (limit) {
      query.limit = parseInt(limit as string);
    }

    const metrics = await this.healthService.getHistoricalMetrics(query);

    res.status(200).json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  });
  public forceCollectMetrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await this.healthService.collectAndSaveMetrics();

    res.status(200).json({
      success: true,
      message: "Metrics collected successfully",
    });
  });

  public cleanupOldMetrics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { days } = req.query;
    const daysToKeep = days ? parseInt(days as string) : 30;

    const deletedCount = await this.healthService.cleanupOldMetrics(daysToKeep);

    res.status(200).json({
      success: true,
      message: `Cleaned up old metrics`,
      deletedCount,
    });
  });
}
