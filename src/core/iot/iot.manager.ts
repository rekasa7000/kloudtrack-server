import AWS from "aws-sdk";
import { device as awsIot } from "aws-iot-device-sdk";
import { EventEmitter } from "events";
import { IoTMessage, StationConnection } from "../../types";
import { StationContainer } from "../../modules/station/container";
import { TelemetryContainer } from "../../modules/telemetry/container";
import { CommandContainer } from "../../modules/command/container";
import { config } from "../../config/environment";
import { logger } from "../utils/logger";
import { S3Service } from "../service/aws-s3";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { RootCertificateContainer } from "../../modules/root-certificate/container";

export class IoTManager extends EventEmitter {
  private static instance: IoTManager;
  private stationConnections: Map<string, awsIot> = new Map();
  private connectionStatus: Map<number, StationConnection> = new Map();
  private iot!: AWS.Iot;
  private iotData!: AWS.IotData;
  private stationContainer: StationContainer;
  private telemetryContainer: TelemetryContainer;
  private commandContainer: CommandContainer;
  private rootCertificateContainer: RootCertificateContainer;
  private s3Service: S3Service;

  constructor(
    stationContainer: StationContainer,
    telemetryContainer: TelemetryContainer,
    commandContainer: CommandContainer,
    rootCertificateContainer: RootCertificateContainer
  ) {
    super();
    this.stationContainer = stationContainer;
    this.telemetryContainer = telemetryContainer;
    this.commandContainer = commandContainer;
    this.rootCertificateContainer = rootCertificateContainer;
    this.s3Service = new S3Service({
      bucketName: config.aws.s3.bucketName,
      region: config.aws.region,
    });
    this.setupAWS();
  }

  private setupAWS(): void {
    AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });

    this.iot = new AWS.Iot();
    this.iotData = new AWS.IotData({
      endpoint: config.aws.iot.endpoint,
    });
  }

  public async initialize(): Promise<void> {
    logger.info("Initializing IoT Manager...");

    try {
      const activeStations = await this.stationContainer.service.getActiveStations();

      for (const station of activeStations) {
        await this.connectStation(station.id);
      }

      logger.info(`IoT Manager initialized with ${activeStations.length} stations`);
    } catch (error) {
      logger.error("Failed to initialize IoT Manager:", error);
      throw error;
    }
  }

  public async connectStation(stationId: number): Promise<void> {
    try {
      const station = await this.stationContainer.service.getStationById(stationId);
      const rootCertificate = await this.rootCertificateContainer.service.getRootCertificate();
      if (!station || !station.certificate) {
        throw new Error(`Station ${stationId} not found or missing certificate`);
      }

      const clientId = `weather-station-${station.serialCode}`;

      if (this.stationConnections.has(clientId)) {
        logger.warn(`Station ${stationId} already connected`);
        return;
      }

      const [privateKey, certificate, rootCA] = await Promise.all([
        this.s3Service.getObject(station.certificate.keyPath),
        this.s3Service.getObject(station.certificate.certPath),
        this.s3Service.getObject(rootCertificate.path),
      ]);

      const certDir = path.join(os.tmpdir(), "iot-certs");
      console.log(certDir);
      await fs.mkdir(certDir, { recursive: true });

      const keyPath = path.join(certDir, "private.key");
      const certPath = path.join(certDir, "certificate.pem");
      const caPath = path.join(certDir, "root-CA.pem");

      await Promise.all([
        fs.writeFile(keyPath, privateKey),
        fs.writeFile(certPath, certificate),
        fs.writeFile(caPath, rootCA),
      ]);

      const device = new awsIot({
        keyPath,
        certPath,
        caPath,
        clientId: clientId,
        host: config.aws.iot.endpoint,
      });

      this.setupDeviceEventHandlers(device, station.id, clientId);
      this.stationConnections.set(clientId, device);

      logger.info(`Connecting station ${stationId} with client ID: ${clientId}`);
    } catch (error) {
      logger.error(`Failed to connect station ${stationId}:`, error);
      throw error;
    }
  }

  private setupDeviceEventHandlers(device: awsIot, stationId: number, clientId: string): void {
    device.on("connect", () => {
      logger.info(`Station ${stationId} connected to AWS IoT`);

      // const telemetryTopic = `weather/stations/${stationId}/telemetry`;
      // const commandTopic = `weather/stations/${stationId}/commands`;
      // const statusTopic = `weather/stations/${stationId}/status`;
      const telemetryTopic = `kloudtrack/KT-DEVICE-12345/data`;
      // const commandTopic = `weather/stations/1/commands`;
      const statusTopic = `weather/stations/1/status`;

      device.subscribe([telemetryTopic, statusTopic]);

      this.updateConnectionStatus(stationId, clientId, true);

      this.emit("stationConnected", { stationId, clientId });
    });

    device.on("message", async (topic: string, payload: Buffer) => {
      try {
        const message: IoTMessage = {
          topic,
          payload: JSON.parse(payload.toString()),
          timestamp: new Date(),
          clientId,
        };

        logger.info(message);

        await this.handleIncomingMessage(stationId, message);
      } catch (error) {
        logger.error(`Error processing message from station ${stationId}:`, error);
      }
    });

    device.on("close", () => {
      logger.warn(`Station ${stationId} disconnected from AWS IoT`);
      this.updateConnectionStatus(stationId, clientId, false);
      this.emit("stationDisconnected", { stationId, clientId });
    });

    device.on("error", (error) => {
      logger.error(`IoT device error for station ${stationId}:`, error);
      this.emit("stationError", { stationId, clientId, error });
    });

    device.on("offline", () => {
      logger.warn(`Station ${stationId} went offline`);
      this.updateConnectionStatus(stationId, clientId, false);
    });

    device.on("reconnect", () => {
      logger.info(`Station ${stationId} reconnected`);
      this.updateConnectionStatus(stationId, clientId, true);
    });
  }

  private async handleIncomingMessage(stationId: number, message: IoTMessage): Promise<void> {
    const { topic, payload } = message;

    if (topic.includes("/data")) {
      await this.handleTelemetryData(stationId, payload);
    } else if (topic.includes("/command")) {
      await this.handleStatusUpdate(stationId, payload);
    } else {
      logger.warn(`Unknown topic received: ${topic}`);
    }
  }

  private async handleTelemetryData(stationId: number, data: any): Promise<void> {
    try {
      const telemetryData = {
        stationId,
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        heatIndex: data.heatIndex,
        windDirection: data.wind_direction,
        windSpeed: data.wind_speed,
        precipitation: data.precipitation,
        uvIndex: data.uv_index,
        distance: data.distance,
        lightIntensity: data.light_intensity,
        recordedAt: new Date(data.recordedAt || Date.now()),
      };

      await this.telemetryContainer.service.createTelemetry(stationId, telemetryData);

      this.emit("telemetryReceived", { stationId, data: telemetryData });

      logger.debug(`Telemetry data saved for station ${stationId}`);
    } catch (error) {
      logger.error(`Failed to process telemetry data for station ${stationId}:`, error);
    }
  }

  private async handleStatusUpdate(stationId: number, status: any): Promise<void> {
    try {
      await this.stationContainer.service.updateStationStatus(stationId, status);

      this.emit("statusUpdated", { stationId, status });

      logger.debug(`Status updated for station ${stationId}`);
    } catch (error) {
      logger.error(`Failed to process status update for station ${stationId}:`, error);
    }
  }

  public async sendCommand(stationId: number, command: any): Promise<void> {
    try {
      const station = await this.stationContainer.service.getStationById(stationId);
      if (!station) {
        throw new Error(`Station ${stationId} not found`);
      }

      const clientId = station.stationName;
      const device = this.stationConnections.get(clientId);

      if (!device) {
        throw new Error(`Station ${stationId} not connected`);
      }

      const commandTopic = `weather/stations/${stationId}/commands`;
      const payload = JSON.stringify({
        command,
        timestamp: new Date().toISOString(),
        commandId: `cmd_${Date.now()}`,
      });

      device.publish(commandTopic, payload);

      logger.info(`Command sent to station ${stationId}: ${JSON.stringify(command)}`);

      this.emit("commandSent", { stationId, command });
    } catch (error) {
      logger.error(`Failed to send command to station ${stationId}:`, error);
      throw error;
    }
  }

  private updateConnectionStatus(stationId: number, clientId: string, isConnected: boolean): void {
    const existing = this.connectionStatus.get(stationId);

    this.connectionStatus.set(stationId, {
      stationId,
      clientId,
      isConnected,
      lastSeen: new Date(),
      connectionCount: existing ? existing.connectionCount + (isConnected ? 1 : 0) : 1,
    });
  }

  public getConnectionStatus(stationId: number): StationConnection | undefined {
    return this.connectionStatus.get(stationId);
  }

  public getAllConnectionStatuses(): StationConnection[] {
    return Array.from(this.connectionStatus.values());
  }

  public async disconnectStation(stationId: number): Promise<void> {
    try {
      const station = await this.stationContainer.service.getStationById(stationId);
      if (!station) {
        throw new Error(`Station ${stationId} not found`);
      }

      const clientId = `weather-station-${station.serialCode}`;
      const device = this.stationConnections.get(clientId);

      if (device) {
        device.end();
        this.stationConnections.delete(clientId);
        this.connectionStatus.delete(stationId);

        logger.info(`Station ${stationId} disconnected`);
      }
    } catch (error) {
      logger.error(`Failed to disconnect station ${stationId}:`, error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    logger.info("Shutting down IoT Manager...");

    const disconnectPromises = Array.from(this.stationConnections.keys()).map((clientId) => {
      const device = this.stationConnections.get(clientId);
      return new Promise<void>((resolve) => {
        if (device) {
          device.end(undefined, () => resolve());
        } else {
          resolve();
        }
      });
    });

    await Promise.all(disconnectPromises);

    this.stationConnections.clear();
    this.connectionStatus.clear();

    logger.info("IoT Manager shutdown completed");
  }
}
