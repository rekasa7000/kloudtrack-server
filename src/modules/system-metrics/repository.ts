import { PrismaClient, SystemMetrics as ServerHealthMetrics } from "@prisma/client";
import { SystemMetrics, TimeRangeQuery } from "./types";

export class SystemMetricsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async saveMetrics(metrics: SystemMetrics): Promise<ServerHealthMetrics> {
    try {
      return await this.prisma.systemMetrics.create({
        data: {
          cpuUsagePercent: metrics.cpu.usagePercent,
          cpuLoad1Min: metrics.cpu.load1Min,
          cpuLoad5Min: metrics.cpu.load5Min,
          cpuLoad15Min: metrics.cpu.load15Min,
          cpuTemperature: metrics.cpu.temperature,

          totalMemoryGB: metrics.memory.totalGB,
          usedMemoryGB: metrics.memory.usedGB,
          freeMemoryGB: metrics.memory.freeGB,
          memoryUsagePercent: metrics.memory.usagePercent,

          totalDiskGB: metrics.disk.totalGB,
          usedDiskGB: metrics.disk.usedGB,
          freeDiskGB: metrics.disk.freeGB,
          diskUsagePercent: metrics.disk.usagePercent,

          networkRxBytes: metrics.network?.rxBytes,
          networkTxBytes: metrics.network?.txBytes,

          uptime: metrics.system.uptime,
          processCount: metrics.system.processCount,
        },
      });
    } catch (error) {
      console.error("Error saving metrics to database:", error);
      throw new Error("Failed to save metrics to database");
    }
  }

  public async getMetrics(query: TimeRangeQuery = {}): Promise<ServerHealthMetrics[]> {
    const { startDate, endDate, limit = 100 } = query;

    try {
      return await this.prisma.systemMetrics.findMany({
        where: {
          timestamp: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching metrics from database:", error);
      throw new Error("Failed to fetch metrics from database");
    }
  }

  public async getLatestMetrics(): Promise<ServerHealthMetrics | null> {
    try {
      return await this.prisma.systemMetrics.findFirst({
        orderBy: {
          timestamp: "desc",
        },
      });
    } catch (error) {
      console.error("Error fetching latest metrics:", error);
      throw new Error("Failed to fetch latest metrics");
    }
  }

  public async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const result = await this.prisma.systemMetrics.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });
      return result.count;
    } catch (error) {
      console.error("Error deleting old metrics:", error);
      throw new Error("Failed to delete old metrics");
    }
  }
}
