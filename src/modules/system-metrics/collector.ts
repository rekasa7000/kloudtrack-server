import * as si from "systeminformation";
import { SystemMetrics } from "./types";

export class SystemMetricsCollector {
  private static instance: SystemMetricsCollector;

  private constructor() {}

  public static getInstance(): SystemMetricsCollector {
    if (!SystemMetricsCollector.instance) {
      SystemMetricsCollector.instance = new SystemMetricsCollector();
    }
    return SystemMetricsCollector.instance;
  }

  private findPrimaryDisk(diskData: any[]): any {
    const rootDisk = diskData.find((disk) => disk.mount === "/");
    if (rootDisk) {
      return rootDisk;
    }

    const regularDisks = diskData.filter((disk) => {
      return (
        disk.rw &&
        disk.size > 1024 * 1024 * 1024 &&
        !["efivarfs", "tmpfs", "devtmpfs", "proc", "sysfs"].includes(disk.type) &&
        !disk.mount?.startsWith("/sys") &&
        !disk.mount?.startsWith("/proc") &&
        !disk.mount?.startsWith("/dev/")
      );
    });

    if (regularDisks.length > 0) {
      return regularDisks.sort((a, b) => b.size - a.size)[0];
    }

    const fallbackDisk = diskData.find((disk) => disk.size > 0);
    return fallbackDisk || { size: 0, used: 0, available: 0 };
  }

  public async collectMetrics(): Promise<SystemMetrics> {
    try {
      const [cpuData, memData, diskData, networkData, systemData, processData, tempData] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.time(),
        si.processes(),
        si.cpuTemperature().catch(() => null),
      ]);

      const cpu = {
        usagePercent: parseFloat(cpuData.currentLoad.toFixed(2)),
        load1Min: parseFloat((cpuData.avgLoad || 0).toFixed(2)),
        load5Min: 0,
        load15Min: 0,
        temperature: tempData?.main ? parseFloat(tempData.main.toFixed(2)) : undefined,
      };

      const primaryDisk = this.findPrimaryDisk(diskData);

      const memory = {
        totalGB: parseFloat((memData.total / 1024 ** 3).toFixed(2)),
        usedGB: parseFloat((memData.used / 1024 ** 3).toFixed(2)),
        freeGB: parseFloat((memData.free / 1024 ** 3).toFixed(2)),
        usagePercent: parseFloat(((memData.used / memData.total) * 100).toFixed(2)),
      };

      const disk = {
        totalGB: parseFloat((primaryDisk.size / 1024 ** 3).toFixed(2)),
        usedGB: parseFloat((primaryDisk.used / 1024 ** 3).toFixed(2)),
        freeDiskGB: parseFloat((primaryDisk.available / 1024 ** 3).toFixed(2)),
        usagePercent: parseFloat(((primaryDisk.used / primaryDisk.size) * 100).toFixed(2)),
      };

      let totalRx = 0n;
      let totalTx = 0n;

      try {
        if (networkData && networkData.length > 0) {
          networkData.forEach((net) => {
            const rxBytes = Math.floor(Math.abs(Number(net.rx_bytes || 0)));
            const txBytes = Math.floor(Math.abs(Number(net.tx_bytes || 0)));

            if (Number.isFinite(rxBytes) && rxBytes >= 0) {
              totalRx += BigInt(rxBytes);
            }
            if (Number.isFinite(txBytes) && txBytes >= 0) {
              totalTx += BigInt(txBytes);
            }
          });
        }
      } catch (networkError) {
        console.warn("Error processing network metrics, using defaults:", networkError);
        totalRx = 0n;
        totalTx = 0n;
      }

      const network = {
        rxBytes: totalRx,
        txBytes: totalTx,
      };

      let systemUptime = 0n;
      try {
        const uptimeValue = Number(systemData.uptime);
        if (Number.isFinite(uptimeValue) && uptimeValue >= 0) {
          systemUptime = BigInt(Math.floor(uptimeValue));
        }
      } catch (uptimeError) {
        console.warn("Error processing uptime, using default:", uptimeError);
        systemUptime = 0n;
      }

      const system = {
        uptime: systemUptime,
        processCount: Math.max(0, Number(processData.all) || 0),
      };

      return {
        cpu,
        memory,
        disk: {
          totalGB: disk.totalGB,
          usedGB: disk.usedGB,
          freeGB: disk.freeDiskGB,
          usagePercent: disk.usagePercent,
        },
        network,
        system,
      };
    } catch (error) {
      console.error("Error collecting system metrics:", error);
      throw new Error("Failed to collect system metrics");
    }
  }
}
