import { PrismaClient } from "@prisma/client";
import { Server as HttpServer } from "http";
import { StationService } from "./station.service";
import { CertificateService } from "./station.certificate";
import { TelemetryService } from "./station.telemetry";
import { CommandService } from "./station.command";
import { AwsIotManager } from "./aws-iot/aws-iot-manager";
import { StationWebSocketServer } from "./station.socket";
import path from "path";

export class StationModule {
  private stationService: StationService;
  private certificateService: CertificateService;
  private telemetryService: TelemetryService;
  private commandService: CommandService;
  private awsIotManager: AwsIotManager;
  private webSocketServer: StationWebSocketServer;

  constructor(prisma: PrismaClient, httpServer: HttpServer, certificateBasePath: string, awsIotEndpoint: string) {
    // Initialize services
    this.stationService = new StationService(prisma);
    this.certificateService = new CertificateService(prisma, certificateBasePath);
    this.telemetryService = new TelemetryService(prisma);
    this.commandService = new CommandService(prisma);

    // Initialize AWS IoT Manager
    this.awsIotManager = new AwsIotManager(
      this.stationService,
      this.certificateService,
      this.telemetryService,
      this.commandService,
      awsIotEndpoint
    );

    // Initialize WebSocket server
    this.webSocketServer = new StationWebSocketServer(httpServer);

    // Set up event handling between AWS IoT and WebSocket
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Forward telemetry data from AWS IoT to WebSocket clients
    this.awsIotManager.on("telemetry", (stationId, telemetryData) => {
      if (this.webSocketServer.hasSubscribers(stationId)) {
        this.webSocketServer.broadcastTelemetry(stationId, telemetryData);
      }
    });

    // Forward command responses from AWS IoT to WebSocket clients
    this.awsIotManager.on("command_response", (stationId, responseData) => {
      this.webSocketServer.broadcastCommandResponse(stationId, responseData);
    });

    // Forward station connection status to WebSocket clients
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

  // Expose services for routes
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
