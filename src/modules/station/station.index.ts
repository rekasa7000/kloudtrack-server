import { PrismaClient } from "@prisma/client";
import { Server as HttpServer } from "http";
import { StationService } from "./station.service";
import { CertificateService } from "./certificate/certificate.service";
import { TelemetryService } from "./telemetry/telemetry.service";
import { CommandService } from "./command/command.service";
import { AwsIotManager } from "./aws-iot/aws-iot-manager";
import { StationWebSocketServer } from "./station.socket";
import commandService from "./command/container";
import telemetryService from "./telemetry/container";
import certificateService from "./certificate/container";

export class StationModule {
  private stationService: StationService;
  private certificateService: CertificateService;
  private telemetryService: TelemetryService;
  private commandService: CommandService;
  private awsIotManager: AwsIotManager;
  private webSocketServer: StationWebSocketServer;

  constructor(prisma: PrismaClient, httpServer: HttpServer, certificateBasePath: string, awsIotEndpoint: string) {
    this.stationService = new StationService(prisma);
    this.certificateService = certificateService;
    this.telemetryService = telemetryService;
    this.commandService = commandService;

    this.awsIotManager = new AwsIotManager(
      this.stationService,
      this.certificateService,
      this.telemetryService,
      this.commandService,
      awsIotEndpoint
    );

    this.webSocketServer = new StationWebSocketServer(httpServer);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.awsIotManager.on("telemetry", (stationId, telemetryData) => {
      if (this.webSocketServer.hasSubscribers(stationId)) {
        this.webSocketServer.broadcastTelemetry(stationId, telemetryData);
      }
    });

    this.awsIotManager.on("command_response", (stationId, responseData) => {
      this.webSocketServer.broadcastCommandResponse(stationId, responseData);
    });

    this.awsIotManager.on("station_connected", (stationId) => {
      this.webSocketServer.broadcastStationStatus(stationId, "connected");
    });

    this.awsIotManager.on("station_offline", (stationId) => {
      this.webSocketServer.broadcastStationStatus(stationId, "disconnected");
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.awsIotManager.initialize();
      console.log("Station module initialized successfully");
    } catch (error) {
      console.error("Error initializing station module:", error);
      throw error;
    }
  }

  async sendCommand(stationId: number, command: Record<string, any>, userId: number): Promise<number> {
    return this.awsIotManager.sendCommand(stationId, command, userId);
  }

  async close(): Promise<void> {
    await this.awsIotManager.close();
  }

  getStationService(): StationService {
    return this.stationService;
  }

  getCertificateService(): CertificateService {
    return this.certificateService;
  }

  getTelemetryService(): TelemetryService {
    return this.telemetryService;
  }

  getCommandService(): CommandService {
    return this.commandService;
  }
}
