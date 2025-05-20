import * as mqtt from "mqtt";
import { Server as HttpServer } from "http";
import { Server as WebSocketServer } from "socket.io";
import { TelemetryData } from "./station.types";

export class StationWebSocketServer {
  private io: WebSocketServer;
  private clientRooms: Map<string, Set<string>> = new Map(); // Map of stationId to connected client IDs

  constructor(httpServer: HttpServer) {
    this.io = new WebSocketServer(httpServer, {
      path: "/station-ws",
      cors: {
        origin: "*", // Configure this based on your security requirements
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle client subscribing to a station
      socket.on("subscribe", (stationId: string) => {
        socket.join(`station-${stationId}`);

        // Track client subscription
        if (!this.clientRooms.has(stationId)) {
          this.clientRooms.set(stationId, new Set());
        }
        this.clientRooms.get(stationId)!.add(socket.id);

        console.log(`Client ${socket.id} subscribed to station ${stationId}`);
      });

      // Handle client unsubscribing from a station
      socket.on("unsubscribe", (stationId: string) => {
        socket.leave(`station-${stationId}`);

        // Update tracking
        if (this.clientRooms.has(stationId)) {
          this.clientRooms.get(stationId)!.delete(socket.id);
          if (this.clientRooms.get(stationId)!.size === 0) {
            this.clientRooms.delete(stationId);
          }
        }

        console.log(`Client ${socket.id} unsubscribed from station ${stationId}`);
      });

      // Handle disconnections
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Clean up all subscriptions for this client
        this.clientRooms.forEach((clients, stationId) => {
          if (clients.has(socket.id)) {
            clients.delete(socket.id);
            if (clients.size === 0) {
              this.clientRooms.delete(stationId);
            }
          }
        });
      });
    });
  }

  broadcastTelemetry(stationId: number, telemetryData: TelemetryData): void {
    this.io.to(`station-${stationId}`).emit("telemetry", {
      stationId,
      data: telemetryData,
    });
  }

  broadcastCommandResponse(stationId: number, responseData: any): void {
    this.io.to(`station-${stationId}`).emit("command_response", {
      stationId,
      data: responseData,
    });
  }

  broadcastStationStatus(stationId: number, status: "connected" | "disconnected"): void {
    this.io.to(`station-${stationId}`).emit("station_status", {
      stationId,
      status,
    });
  }

  hasSubscribers(stationId: number): boolean {
    return this.clientRooms.has(stationId.toString()) && this.clientRooms.get(stationId.toString())!.size > 0;
  }
}
