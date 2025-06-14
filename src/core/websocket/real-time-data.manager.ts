import { Server as SocketIOServer } from "socket.io";
import { StationContainer } from "../../modules/station/container";
import { TelemetryContainer } from "../../modules/telemetry/container";
import { EventEmitter } from "events";
import { Prisma } from "@prisma/client";

export interface TelemetryData {
  stationId: number; // Changed from string to number to match your schema
  timestamp: Date;
  data: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    heatIndex?: number;
    windDirection?: number;
    windSpeed?: number;
    precipitation?: number;
    uvIndex?: number;
    distance?: number;
    lightIntensity?: number;
    [key: string]: any;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface StationStatus {
  stationId: number; // Changed from string to number
  status: "online" | "offline" | "error" | "maintenance";
  lastSeen: Date;
  metadata?: {
    [key: string]: any;
  };
}

export class RealTimeDataManager extends EventEmitter {
  private dataBuffer: Map<number, TelemetryData[]> = new Map(); // Changed key type to number
  private stationStatus: Map<number, StationStatus> = new Map(); // Changed key type to number
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
    // Listen for telemetry data from MQTT/IoT Manager
    this.setupTelemetryListeners();

    // Listen for station status updates
    this.setupStationStatusListeners();

    console.log("Real-time Data Manager initialized");
  }

  private setupTelemetryListeners(): void {
    // Listen for new telemetry data from MQTT
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

    // Update station status to online when receiving data
    this.updateStationStatus({
      stationId: data.stationId,
      status: "online",
      lastSeen: data.timestamp,
      metadata: { lastDataReceived: data.timestamp },
    });
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

  private getStationThresholds(stationId: number): { [key: string]: any } {
    // This would typically come from database configuration
    // For now, return default thresholds based on your telemetry schema
    return {
      temperature: { min: -40, max: 60 },
      humidity: { min: 0, max: 100 },
      pressure: { min: 800, max: 1200 },
      heatIndex: { min: -50, max: 70 },
      windSpeed: { min: 0, max: 200 },
      windDirection: { min: 0, max: 360 },
      precipitation: { min: 0, max: 1000 },
      uvIndex: { min: 0, max: 15 },
      distance: { min: 0, max: 10000 },
      lightIntensity: { min: 0, max: 100000 },
    };
  }

  private isThresholdExceeded(value: any, threshold: any): boolean {
    if (typeof value !== "number") return false;

    if (threshold.min !== undefined && value < threshold.min) return true;
    if (threshold.max !== undefined && value > threshold.max) return true;

    return false;
  }

  private aggregateRecentData(stationId: number): any {
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

  private async flushBufferedData(): Promise<void> {
    if (this.dataBuffer.size === 0) return;

    try {
      // Process each station's buffered data
      for (const [stationId, dataArray] of this.dataBuffer.entries()) {
        if (dataArray.length === 0) continue;

        // Save to database in batch
        await this.saveTelemetryBatch(stationId, dataArray);

        // Clear buffer for this station
        this.dataBuffer.set(stationId, []);
      }
    } catch (error) {
      console.error("Error flushing buffered data:", error);
    }
  }

  private async saveTelemetryBatch(stationId: number, dataArray: TelemetryData[]): Promise<void> {
    try {
      // Process each telemetry data point individually since your service doesn't have createBatch
      for (const data of dataArray) {
        const telemetryRecord: Prisma.TelemetryUncheckedCreateInput = {
          stationId: data.stationId,
          recordedAt: data.timestamp,
          temperature: data.data.temperature,
          humidity: data.data.humidity,
          pressure: data.data.pressure,
          heatIndex: data.data.heatIndex,
          windDirection: data.data.windDirection,
          windSpeed: data.data.windSpeed,
          precipitation: data.data.precipitation,
          uvIndex: data.data.uvIndex,
          distance: data.data.distance,
          lightIntensity: data.data.lightIntensity,
        };

        // Save using telemetry container service
        await this.telemetryContainer.service.createTelemetry(data.stationId, telemetryRecord);
      }
    } catch (error) {
      console.error(`Error saving telemetry batch for station ${stationId}:`, error);
    }
  }

  private async checkStationStatuses(): Promise<void> {
    try {
      // Get all stations - you'll need to implement getActiveStations in your StationContainer
      // For now, check all stations that have sent data
      const stationIds = Array.from(this.stationStatus.keys());

      for (const stationId of stationIds) {
        const lastSeen = await this.getStationLastSeen(stationId);
        const now = new Date();
        const timeSinceLastSeen = now.getTime() - lastSeen.getTime();

        let status: StationStatus["status"] = "online";

        // Consider offline if no data received for 2 minutes
        if (timeSinceLastSeen > 2 * 60 * 1000) {
          status = "offline";
        }

        // Consider error if no data received for 10 minutes
        if (timeSinceLastSeen > 10 * 60 * 1000) {
          status = "error";
        }

        const currentStatus = this.stationStatus.get(stationId);

        // Only emit if status changed
        if (!currentStatus || currentStatus.status !== status) {
          this.emit("station_status_changed", {
            stationId: stationId,
            status,
            lastSeen,
            metadata: {
              timeSinceLastSeen,
              previousStatus: currentStatus?.status,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error checking station statuses:", error);
    }
  }

  private async getStationLastSeen(stationId: number): Promise<Date> {
    try {
      // Get the latest telemetry data for this station
      const telemetryData = await this.telemetryContainer.service.findManyTelemetry(stationId, 1, 0);
      if (telemetryData && telemetryData.data && telemetryData.data.length > 0) {
        return telemetryData.data[0].recordedAt;
      }
      return new Date(0);
    } catch (error) {
      return new Date(0);
    }
  }

  // Public methods for external services (MQTT handlers can call these)
  public receiveTelemetryData(data: TelemetryData): void {
    this.emit("telemetry_received", data);
  }

  public receiveTelemetryBatch(dataArray: TelemetryData[]): void {
    this.emit("telemetry_batch_received", dataArray);
  }

  public updateStationStatus(status: StationStatus): void {
    this.emit("station_status_changed", status);
  }

  public getStationStatus(stationId: number): StationStatus | undefined {
    return this.stationStatus.get(stationId);
  }

  public getAllStationStatuses(): Map<number, StationStatus> {
    return new Map(this.stationStatus);
  }

  public async getStationDataSummary(stationId: number, hours: number = 24): Promise<any> {
    try {
      // Calculate how many records to fetch based on hours
      // Assuming data comes every 5 minutes, 12 records per hour
      const recordsToFetch = hours * 12;
      const summary = await this.telemetryContainer.service.findManyTelemetry(stationId, recordsToFetch, 0);
      return summary;
    } catch (error) {
      console.error("Error getting station data summary:", error);
      return null;
    }
  }

  // Method to process MQTT message and convert to TelemetryData
  public processMqttMessage(stationId: number, mqttPayload: any): void {
    try {
      const telemetryData: TelemetryData = {
        stationId: stationId,
        timestamp: new Date(),
        data: {
          temperature: mqttPayload.temperature,
          humidity: mqttPayload.humidity,
          pressure: mqttPayload.pressure,
          heatIndex: mqttPayload.heatIndex,
          windDirection: mqttPayload.windDirection,
          windSpeed: mqttPayload.windSpeed,
          precipitation: mqttPayload.precipitation,
          uvIndex: mqttPayload.uvIndex,
          distance: mqttPayload.distance,
          lightIntensity: mqttPayload.lightIntensity,
        },
        metadata: {
          source: "mqtt",
          receivedAt: new Date(),
          rawPayload: mqttPayload,
        },
      };

      this.receiveTelemetryData(telemetryData);
    } catch (error) {
      console.error(`Error processing MQTT message for station ${stationId}:`, error);
    }
  }

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
