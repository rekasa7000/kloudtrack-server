import { AwsIotClient } from "./aws-iot-client";
import { CertificateService } from "../station.certificate";
import { StationService } from "../station.service";
import { StationConfig, MqttMessage } from "../station.types";
import { EventEmitter } from "events";
import { TelemetryService } from "../station.telemetry";
import { CommandService } from "../station.command";

export class AwsIotManager extends EventEmitter {
  private stationService: StationService;
  private certificateService: CertificateService;
  private telemetryService: TelemetryService;
  private commandService: CommandService;
  private clients: Map<number, AwsIotClient> = new Map();
  private endpoint: string;
  private isInitialized: boolean = false;

  constructor(
    stationService: StationService,
    certificateService: CertificateService,
    telemetryService: TelemetryService,
    commandService: CommandService,
    endpoint: string
  ) {
    super();
    this.stationService = stationService;
    this.certificateService = certificateService;
    this.telemetryService = telemetryService;
    this.commandService = commandService;
    this.endpoint = endpoint;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get all active stations
      const stationConfigs = await this.stationService.getAllStationConfigs();

      // Create and connect clients for each station
      for (const config of stationConfigs) {
        await this.connectStation(config);
      }

      this.isInitialized = true;
      console.log("AWS IoT Manager initialized successfully");
    } catch (error) {
      console.error("Error initializing AWS IoT Manager:", error);
      throw error;
    }
  }

  async connectStation(stationConfig: StationConfig): Promise<void> {
    try {
      // Create a new client for this station
      const client = new AwsIotClient(stationConfig, this.certificateService, this.endpoint);

      // Set up event listeners
      client.on("message", (message: MqttMessage) => this.handleMessage(stationConfig.stationId, message));
      client.on("error", (error) => this.emit("error", stationConfig.stationId, error));
      client.on("connected", () => this.emit("station_connected", stationConfig.stationId));
      client.on("offline", () => this.emit("station_offline", stationConfig.stationId));
      client.on("max_reconnect_attempts", () => {
        console.log(`Scheduling reconnection for station ${stationConfig.stationId}`);
        // Schedule reconnection after some time
        setTimeout(() => {
          console.log(`Attempting to reconnect station ${stationConfig.stationId}`);
          this.reconnectStation(stationConfig.stationId);
        }, 60000); // 1 minute
      });

      // Connect to AWS IoT Core
      await client.connect();

      // Subscribe to relevant topics
      await client.subscribe(`station/${stationConfig.serialCode}/telemetry`);
      await client.subscribe(`station/${stationConfig.serialCode}/command/response`);

      // Store the client
      this.clients.set(stationConfig.stationId, client);

      console.log(`Connected to AWS IoT Core for station ${stationConfig.stationId}`);
    } catch (error) {
      console.error(`Error connecting station ${stationConfig.stationId}:`, error);
      this.emit("connection_error", stationConfig.stationId, error);
    }
  }

  async reconnectStation(stationId: number): Promise<void> {
    try {
      // Close existing connection if any
      const existingClient = this.clients.get(stationId);
      if (existingClient) {
        existingClient.close();
        this.clients.delete(stationId);
      }

      // Get station config
      const stationConfig = await this.stationService.getStationConfig(stationId);

      // Reconnect
      await this.connectStation(stationConfig);
    } catch (error) {
      console.error(`Error reconnecting station ${stationId}:`, error);
      this.emit("reconnection_error", stationId, error);
    }
  }

  async sendCommand(stationId: number, command: Record<string, any>, userId: number): Promise<number> {
    try {
      const client = this.clients.get(stationId);
      if (!client) {
        throw new Error(`No connected client for station ID: ${stationId}`);
      }

      const station = await this.stationService.getStationById(stationId);
      if (!station) {
        throw new Error(`Station not found: ${stationId}`);
      }

      // Save command to database
      const commandId = await this.commandService.saveCommand({
        stationId,
        command,
        issuedBy: userId,
      });

      // Add command ID to payload
      const payload = {
        ...command,
        commandId,
      };

      // Publish command
      await client.publish(`station/${station.serialCode}/command`, payload);

      return commandId;
    } catch (error) {
      console.error(`Error sending command to station ${stationId}:`, error);
      throw error;
    }
  }

  private async handleMessage(stationId: number, message: MqttMessage): Promise<void> {
    try {
      // Extract the station serial code from the topic
      const topicParts = message.topic.split("/");
      const serialCode = topicParts[1];

      // Check message type based on the topic
      if (message.topic.endsWith("/telemetry")) {
        // Process telemetry data
        const telemetryData = {
          stationId,
          ...message.payload,
          recordedAt: new Date(message.payload.timestamp || Date.now()),
        };

        // Save telemetry to database
        await this.telemetryService.saveTelemetry(telemetryData);

        // Forward telemetry to WebSocket clients
        this.emit("telemetry", stationId, telemetryData);
      } else if (message.topic.endsWith("/command/response")) {
        // Process command response
        if (message.payload.commandId && message.payload.status === "executed") {
          // Update command status in database
          await this.commandService.updateCommandExecuted(message.payload.commandId);
        }

        // Forward command response to WebSocket clients
        this.emit("command_response", stationId, message.payload);
      }
    } catch (error) {
      console.error(`Error handling message for station ${stationId}:`, error);
    }
  }

  async close(): Promise<void> {
    for (const [stationId, client] of this.clients.entries()) {
      client.close();
      console.log(`Closed connection for station ${stationId}`);
    }

    this.clients.clear();
    this.isInitialized = false;
  }
}
