import { Server as SocketIOServer, Socket } from "socket.io";
import { UserContainer } from "../../modules/user/container";
import { StationContainer } from "../../modules/station/container";
import { TelemetryContainer } from "../../modules/telemetry/container";
import { CommandContainer } from "../../modules/command/container";
import { PresenceManager } from "./presense.manager";
import { NotificationManager } from "./notification.manager";
import { RealTimeDataManager } from "./real-time-data.manager";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  organizationId?: number;
  userRole?: string;
}

export class WebSocketManager {
  private presenceManager: PresenceManager;
  private notificationManager: NotificationManager;
  private realTimeDataManager: RealTimeDataManager;

  constructor(
    private io: SocketIOServer,
    private userContainer: UserContainer,
    private stationContainer: StationContainer,
    private telemetryContainer: TelemetryContainer,
    private commandContainer: CommandContainer
  ) {
    this.presenceManager = new PresenceManager(this.io);
    this.notificationManager = new NotificationManager(this.io);
    this.realTimeDataManager = new RealTimeDataManager(this.io, this.stationContainer, this.telemetryContainer);
  }

  public initialize(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Handle user presence
      this.handleUserPresence(socket);

      // Handle real-time data subscriptions
      this.handleDataSubscriptions(socket);

      // Handle commands
      this.handleCommands(socket);

      // Handle notifications
      this.handleNotifications(socket);

      // Handle disconnection
      this.handleDisconnection(socket);
    });

    // Initialize managers
    this.presenceManager.initialize();
    this.realTimeDataManager.initialize();

    console.log("WebSocket Manager initialized");
  }

  private handleUserPresence(socket: AuthenticatedSocket): void {
    // User comes online
    this.presenceManager.setUserOnline(socket.userId!, socket.id);

    // Handle heartbeat for presence
    socket.on("heartbeat", () => {
      this.presenceManager.updateUserActivity(socket.userId!);
    });

    // Handle manual status updates
    socket.on("update_status", (status: string) => {
      this.presenceManager.updateUserStatus(socket.userId!, status);
    });
  }

  private handleDataSubscriptions(socket: AuthenticatedSocket): void {
    // Subscribe to station data
    socket.on("subscribe_station", async (stationId: number) => {
      try {
        // Verify user has access to this station
        const hasAccess = await this.verifyStationAccess(socket.userId!, socket.organizationId!, stationId);

        if (hasAccess) {
          socket.join(`station:${stationId}`);
          socket.emit("subscription_confirmed", { type: "station", id: stationId });
        } else {
          socket.emit("subscription_error", {
            message: "Access denied to station",
            stationId,
          });
        }
      } catch (error) {
        socket.emit("subscription_error", {
          message: "Failed to subscribe to station",
          error: error,
        });
      }
    });

    // Unsubscribe from station data
    socket.on("unsubscribe_station", (stationId: number) => {
      socket.leave(`station:${stationId}`);
      socket.emit("unsubscription_confirmed", { type: "station", id: stationId });
    });

    // Subscribe to organization-wide updates
    socket.on("subscribe_organization", () => {
      socket.join(`organization:${socket.organizationId}`);
      socket.emit("subscription_confirmed", {
        type: "organization",
        id: socket.organizationId,
      });
    });
  }

  private handleCommands(socket: AuthenticatedSocket): void {
    socket.on("send_command", async (data: { stationId: number; command: string; parameters?: any }) => {
      try {
        // Verify user has command permissions
        const hasPermission = await this.verifyCommandPermission(socket.userId!, socket.userRole!, data.stationId);

        if (!hasPermission) {
          socket.emit("command_error", {
            message: "Insufficient permissions to send command",
            stationId: data.stationId,
          });
          return;
        }

        // Send command through command container
        const result = await this.commandContainer.service.createAndSendCommand({
          stationId: data.stationId,
          command: data.command,
          parameters: data.parameters,
          userId: socket.userId!,
        });

        socket.emit("command_sent", {
          commandId: result.id,
          stationId: data.stationId,
          status: "sent",
        });

        // Broadcast to station subscribers
        this.io.to(`station:${data.stationId}`).emit("station_command", {
          commandId: result.id,
          command: data.command,
          status: "sent",
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit("command_error", {
          message: "Failed to send command",
          error: error,
        });
      }
    });
  }

  private handleNotifications(socket: AuthenticatedSocket): void {
    // Mark notification as read
    socket.on("mark_notification_read", async (notificationId: string) => {
      try {
        await this.notificationManager.markAsRead(notificationId, socket.userId!);
        socket.emit("notification_marked_read", { notificationId });
      } catch (error) {
        socket.emit("notification_error", {
          message: "Failed to mark notification as read",
          error: error,
        });
      }
    });

    // Get unread notification count
    socket.on("get_unread_count", async () => {
      try {
        const count = await this.notificationManager.getUnreadCount(socket.userId!);
        socket.emit("unread_count", { count });
      } catch (error) {
        socket.emit("notification_error", {
          message: "Failed to get unread count",
          error: error,
        });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Update user presence
      this.presenceManager.setUserOffline(socket.userId!, socket.id);
    });
  }

  private async verifyStationAccess(userId: number, organizationId: number, stationId: number): Promise<boolean> {
    try {
      const station = await this.stationContainer.service.getStationById(stationId);
      return station ? station.organizationId === organizationId : false;
    } catch (error) {
      return false;
    }
  }

  private async verifyCommandPermission(userId: number, userRole: string, stationId: number): Promise<boolean> {
    const allowedRoles = ["admin", "superadmin"];
    return allowedRoles.includes(userRole.toLowerCase());
  }

  // Public methods for external services to broadcast data
  public broadcastToStation(stationId: number, event: string, data: any): void {
    this.io.to(`station:${stationId}`).emit(event, data);
  }

  public broadcastToOrganization(organizationId: string, event: string, data: any): void {
    this.io.to(`organization:${organizationId}`).emit(event, data);
  }

  public broadcastToUser(userId: number, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public getPresenceManager(): PresenceManager {
    return this.presenceManager;
  }

  public getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  public getRealTimeDataManager(): RealTimeDataManager {
    return this.realTimeDataManager;
  }
}
