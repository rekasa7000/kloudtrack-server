// core/websocket/realtime-data.manager.ts
import { Server as SocketIOServer } from "socket.io";
import { StationContainer } from "../../modules/station/container";
import { TelemetryContainer } from "../../modules/telemetry/container";
import { EventEmitter } from "events";

export interface TelemetryData {
  stationId: string;
  timestamp: Date;
  data: {
    [key: string]: any;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface StationStatus {
  stationId: string;
  status: "online" | "offline" | "error" | "maintenance";
  lastSeen: Date;
  metadata?: {
    [key: string]: any;
  };
}

export class RealTimeDataManager extends EventEmitter {
  private dataBuffer: Map<string, TelemetryData[]> = new Map();
  private stationStatus: Map<string, StationStatus> = new Map();
  private flushInterval: NodeJS.Timeout;
  private statusCheckInterval: NodeJS.Timeout;

  constructor(
    private io: SocketIOServer,
    private stationContainer: StationContainer,
    private telemetryContainer: TelemetryContainer
  ) {
    super();

    // Setup periodic data flushing
    this.flushInterval = setInterval(() => {
      this.flushBufferedData();
    }, 5000); // Flush every 5 seconds

    // Setup station status checking
    this.statusCheckInterval = setInterval(() => {
      this.checkStationStatuses();
    }, 30000); // Check every 30 seconds
  }

  public initialize(): void {
    // Listen for telemetry data from IoT Manager
    this.setupTelemetryListeners();

    // Listen for station status updates
    this.setupStationStatusListeners();

    console.log("Real-time Data Manager initialized");
  }

  private setupTelemetryListeners(): void {
    // Listen for new telemetry data
    this.on("telemetry_received", (data: TelemetryData) => {
      this.handleTelemetryData(data);
    });

    // Listen for batch telemetry data
    this.on("telemetry_batch_received", (dataArray: TelemetryData[]) => {
      dataArray.forEach((data) => this.handleTelemetryData(data));
    });
  }

  private setupStationStatusListeners(): void {
    // Listen for station status changes
    this.on("station_status_changed", (status: StationStatus) => {
      this.handleStationStatusChange(status);
    });
  }

  private handleTelemetryData(data: TelemetryData): void {
    // Add to buffer for batch processing
    if (!this.dataBuffer.has(data.stationId)) {
      this.dataBuffer.set(data.stationId, []);
    }
    this.dataBuffer.get(data.stationId)!.push(data);

    // Send real-time data to subscribers
    this.broadcastTelemetryData(data);

    // Check for alerts/thresholds
    this.checkDataThresholds(data);
  }

  private handleStationStatusChange(status: StationStatus): void {
    const previousStatus = this.stationStatus.get(status.stationId);
    this.stationStatus.set(status.stationId, status);

    // Broadcast status change
    this.io.to(`station:${status.stationId}`).emit("station_status", {
      stationId: status.stationId,
      status: status.status,
      lastSeen: status.lastSeen,
      previousStatus: previousStatus?.status,
      metadata: status.metadata,
    });

    // If status changed from online to offline or error, send alert
    if (
      previousStatus &&
      previousStatus.status === "online" &&
      (status.status === "offline" || status.status === "error")
    ) {
      this.emit("station_alert", {
        stationId: status.stationId,
        type: "connection_lost",
        message: `Station ${status.stationId} went ${status.status}`,
        severity: status.status === "error" ? "high" : "medium",
      });
    }
  }

  private broadcastTelemetryData(data: TelemetryData): void {
    // Send to station subscribers
    this.io.to(`station:${data.stationId}`).emit("telemetry_data", {
      stationId: data.stationId,
      timestamp: data.timestamp,
      data: data.data,
      metadata: data.metadata,
    });

    // Send aggregated data for dashboard views
    const aggregatedData = this.aggregateRecentData(data.stationId);
    if (aggregatedData) {
      this.io.to(`station:${data.stationId}`).emit("telemetry_aggregated", aggregatedData);
    }
  }

  private checkDataThresholds(data: TelemetryData): void {
    // Implement threshold checking logic
    const thresholds = this.getStationThresholds(data.stationId);

    for (const [parameter, value] of Object.entries(data.data)) {
      const threshold = thresholds[parameter];
      if (threshold && this.isThresholdExceeded(value, threshold)) {
        this.emit("threshold_exceeded", {
          stationId: data.stationId,
          parameter,
          value,
          threshold,
          timestamp: data.timestamp,
        });
      }
    }
  }

  private getStationThresholds(stationId: string): { [key: string]: any } {
    // This would typically come from database configuration
    // For now, return default thresholds
    return {
      temperature: { min: -10, max: 50 },
      humidity: { min: 0, max: 100 },
      pressure: { min: 800, max: 1200 },
      voltage: { min: 11.5, max: 14.5 },
    };
  }

  private isThresholdExceeded(value: any, threshold: any): boolean {
    if (typeof value !== "number") return false;

    if (threshold.min !== undefined && value < threshold.min) return true;
    if (threshold.max !== undefined && value > threshold.max) return true;

    return false;
  }

  private aggregateRecentData(stationId: string): any {
    const recentData = this.dataBuffer.get(stationId) || [];
    if (recentData.length === 0) return null;

    // Get data from last 5 minutes
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000);
    const filteredData = recentData.filter((d) => d.timestamp >= cutoffTime);

    if (filteredData.length === 0) return null;

    // Calculate aggregations
    const aggregated: { [key: string]: any } = {};

    // Get all unique parameters
    const parameters = new Set<string>();
    filteredData.forEach((d) => {
      Object.keys(d.data).forEach((key) => parameters.add(key));
    });

    // Calculate min, max, avg for each parameter
    parameters.forEach((param) => {
      const values = filteredData.map((d) => d.data[param]).filter((v) => typeof v === "number");

      if (values.length > 0) {
        aggregated[param] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
          latest: filteredData[filteredData.length - 1].data[param],
        };
      }
    });

    return {
      stationId,
      timeRange: {
        start: filteredData[0].timestamp,
        end: filteredData[filteredData.length - 1].timestamp,
      },
      aggregations: aggregated,
      dataPoints: filteredData.length,
    };
  }

  //   private async flushBufferedData(): Promise<void> {
  //     if (this.dataBuffer.size === 0) return;

  //     try {
  //       // Process each station's buffered data
  //       for (const [stationId, dataArray] of this.dataBuffer.entries()) {
  //         if (dataArray.length === 0) continue;

  //         // Save to database in batch
  //         await this.saveTelemetryBatch(stationId, dataArray);

  //         // Clear buffer for this station
  //         this.dataBuffer.set(stationId, []);
  //       }
  //     } catch (error) {
  //       console.error("Error flushing buffered data:", error);
  //     }
  //   }

  //   private async saveTelemetryBatch(stationId: number, dataArray: TelemetryData[]): Promise<void> {
  //     try {
  //       // Prepare batch data for database
  //       const telemetryRecords = dataArray.map((data) => ({
  //         stationId: data.stationId,
  //         timestamp: data.timestamp,
  //         data: JSON.stringify(data.data),
  //         metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  //       }));

  //       // Save using telemetry container
  //       await this.telemetryContainer.service.createBatch(telemetryRecords);
  //     } catch (error) {
  //       console.error(`Error saving telemetry batch for station ${stationId}:`, error);
  //     }
  //   }

  //   private async checkStationStatuses(): Promise<void> {
  //     try {
  //       // Get all stations that should be online
  //       const stations = await this.stationContainer.service.getActiveStations();

  //       for (const station of stations) {
  //         const lastSeen = await this.getStationLastSeen(station.id);
  //         const now = new Date();
  //         const timeSinceLastSeen = now.getTime() - lastSeen.getTime();

  //         let status: StationStatus["status"] = "online";

  //         // Consider offline if no data received for 2 minutes
  //         if (timeSinceLastSeen > 2 * 60 * 1000) {
  //           status = "offline";
  //         }

  //         // Consider error if no data received for 10 minutes
  //         if (timeSinceLastSeen > 10 * 60 * 1000) {
  //           status = "error";
  //         }

  //         const currentStatus = this.stationStatus.get(station.id);

  //         // Only emit if status changed
  //         if (!currentStatus || currentStatus.status !== status) {
  //           this.emit("station_status_changed", {
  //             stationId: station.id,
  //             status,
  //             lastSeen,
  //             metadata: {
  //               timeSinceLastSeen,
  //               previousStatus: currentStatus?.status,
  //             },
  //           });
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error checking station statuses:", error);
  //     }
  //   }

  //   private async getStationLastSeen(stationId: string): Promise<Date> {
  //     try {
  //       const lastTelemetry = await this.telemetryContainer.service.getLatest(stationId);
  //       return lastTelemetry ? lastTelemetry.timestamp : new Date(0);
  //     } catch (error) {
  //       return new Date(0);
  //     }
  //   }

  // Public methods for external services
  public receiveTelemetryData(data: TelemetryData): void {
    this.emit("telemetry_received", data);
  }

  public receiveTelemetryBatch(dataArray: TelemetryData[]): void {
    this.emit("telemetry_batch_received", dataArray);
  }

  public updateStationStatus(status: StationStatus): void {
    this.emit("station_status_changed", status);
  }

  public getStationStatus(stationId: string): StationStatus | undefined {
    return this.stationStatus.get(stationId);
  }

  public getAllStationStatuses(): Map<string, StationStatus> {
    return new Map(this.stationStatus);
  }

  //   public async getStationDataSummary(stationId: string, hours: number = 24): Promise<any> {
  //     try {
  //       const summary = await this.telemetryContainer.service.getDataSummary(stationId, hours);
  //       return summary;
  //     } catch (error) {
  //       console.error("Error getting station data summary:", error);
  //       return null;
  //     }
  //   }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    this.removeAllListeners();
  }
}
