import { SystemMetricsRepository } from "./repository";
import { SystemMetricsCollector } from "./collector";
import { HealthMetricsResponse, TimeRangeQuery } from "./types";
import * as cron from "node-cron";

export class SystemMetricsService {
  private repository: SystemMetricsRepository;
  private metricsCollector: SystemMetricsCollector;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(repository: SystemMetricsRepository) {
    this.repository = repository;
    this.metricsCollector = SystemMetricsCollector.getInstance();
  }

  public async collectAndSaveMetrics(): Promise<void> {
    try {
      const metrics = await this.metricsCollector.collectMetrics();
      await this.repository.saveMetrics(metrics);
      console.log(`[${new Date().toISOString()}] Health metrics collected and saved`);
    } catch (error) {
      console.error("Error in collectAndSaveMetrics:", error);
      throw error;
    }
  }

  public async getCurrentMetrics(): Promise<HealthMetricsResponse | null> {
    try {
      const latest = await this.repository.getLatestMetrics();
      if (!latest) return null;

      return this.formatMetricsResponse(latest);
    } catch (error) {
      console.error("Error getting current metrics:", error);
      throw error;
    }
  }

  public async getHistoricalMetrics(query: TimeRangeQuery): Promise<HealthMetricsResponse[]> {
    try {
      const metrics = await this.repository.getMetrics(query);
      return metrics.map((metric) => this.formatMetricsResponse(metric));
    } catch (error) {
      console.error("Error getting historical metrics:", error);
      throw error;
    }
  }

  public startMetricsCollection(): void {
    if (this.cronJob) {
      console.log("Metrics collection is already running");
      return;
    }

    this.cronJob = cron.schedule("* * * * *", async () => {
      try {
        await this.collectAndSaveMetrics();
      } catch (error) {
        console.error("Scheduled metrics collection failed:", error);
      }
    });

    console.log("Started automatic metrics collection (every 1 minute)");

    this.collectAndSaveMetrics().catch((error) => {
      console.error("Initial metrics collection failed:", error);
    });
  }

  public stopMetricsCollection(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log("Stopped automatic metrics collection");
    }
  }

  public async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      return await this.repository.deleteOldMetrics(daysToKeep);
    } catch (error) {
      console.error("Error cleaning up old metrics:", error);
      throw error;
    }
  }

  private formatMetricsResponse(metrics: any): HealthMetricsResponse {
    return {
      id: metrics.id,
      timestamp: metrics.timestamp,
      cpu: {
        usagePercent: metrics.cpuUsagePercent,
        load1Min: metrics.cpuLoad1Min,
        load5Min: metrics.cpuLoad5Min,
        load15Min: metrics.cpuLoad15Min,
        temperature: metrics.cpuTemperature,
      },
      memory: {
        totalGB: metrics.totalMemoryGB,
        usedGB: metrics.usedMemoryGB,
        freeGB: metrics.freeMemoryGB,
        usagePercent: metrics.memoryUsagePercent,
      },
      disk: {
        totalGB: metrics.totalDiskGB,
        usedGB: metrics.usedDiskGB,
        freeGB: metrics.freeDiskGB,
        usagePercent: metrics.diskUsagePercent,
      },
      network:
        metrics.networkRxBytes && metrics.networkTxBytes
          ? {
              rxBytes: metrics.networkRxBytes.toString(),
              txBytes: metrics.networkTxBytes.toString(),
            }
          : undefined,
      system: {
        uptime: metrics.uptime.toString(),
        processCount: metrics.processCount,
      },
    };
  }
}
