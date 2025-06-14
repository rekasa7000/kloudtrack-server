import { Server as SocketIOServer, Socket } from "socket.io";
import { UserContainer } from "../../modules/user/container";
import { StationContainer } from "../../modules/station/container";
import { TelemetryContainer } from "../../modules/telemetry/container";
import { CommandContainer } from "../../modules/command/container";
import { PresenceManager } from "./presense.manager";
import { NotificationManager } from "./notification.manager";
import { RealTimeDataManager } from "./real-time-data.manager";
import { CommandPayload, Commands } from "../../modules/command/type";

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
    if (!socket.userId) return;

    // User comes online
    this.presenceManager.setUserOnline(socket.userId, socket.id);

    // Handle heartbeat for presence
    socket.on("heartbeat", () => {
      if (socket.userId) {
        this.presenceManager.updateUserActivity(socket.userId);
      }
    });

    // Handle manual status updates
    socket.on("update_status", (status: string) => {
      if (socket.userId) {
        this.presenceManager.updateUserStatus(socket.userId, status);
      }
    });
  }

  private handleDataSubscriptions(socket: AuthenticatedSocket): void {
    // Subscribe to station data
    socket.on("subscribe_station", async (stationId: number) => {
      try {
        if (!socket.userId || !socket.organizationId) {
          socket.emit("subscription_error", {
            message: "Authentication required",
            stationId,
          });
          return;
        }

        // Verify user has access to this station
        const hasAccess = await this.verifyStationAccess(socket.userId, socket.organizationId, stationId);

        if (hasAccess) {
          socket.join(`station:${stationId}`);
          socket.emit("subscription_confirmed", { type: "station", id: stationId });

          // Send current station status
          const stationStatus = this.realTimeDataManager.getStationStatus(stationId);
          if (stationStatus) {
            socket.emit("station_status", stationStatus);
          }
        } else {
          socket.emit("subscription_error", {
            message: "Access denied to station",
            stationId,
          });
        }
      } catch (error) {
        console.error(`Error subscribing to station ${stationId}:`, error);
        socket.emit("subscription_error", {
          message: "Failed to subscribe to station",
          stationId,
          error: error instanceof Error ? error.message : "Unknown error",
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
      if (socket.organizationId) {
        socket.join(`organization:${socket.organizationId}`);
        socket.emit("subscription_confirmed", {
          type: "organization",
          id: socket.organizationId,
        });
      }
    });

    // Request historical data
    socket.on("get_station_summary", async (data: { stationId: number; hours?: number }) => {
      try {
        if (!socket.userId || !socket.organizationId) {
          socket.emit("data_error", { message: "Authentication required" });
          return;
        }

        const hasAccess = await this.verifyStationAccess(socket.userId, socket.organizationId, data.stationId);
        if (!hasAccess) {
          socket.emit("data_error", { message: "Access denied to station data" });
          return;
        }

        const summary = await this.realTimeDataManager.getStationDataSummary(data.stationId, data.hours || 24);
        socket.emit("station_summary", {
          stationId: data.stationId,
          data: summary,
        });
      } catch (error) {
        console.error(`Error getting station summary:`, error);
        socket.emit("data_error", {
          message: "Failed to get station summary",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  private handleCommands(socket: AuthenticatedSocket): void {
    socket.on("send_command", async (data: { stationId: number; command: Commands; parameters?: any }) => {
      try {
        if (!socket.userId || !socket.userRole) {
          socket.emit("command_error", {
            message: "Authentication required",
            stationId: data.stationId,
          });
          return;
        }

        // Verify user has command permissions
        const hasPermission = await this.verifyCommandPermission(socket.userId, socket.userRole, data.stationId);

        if (!hasPermission) {
          socket.emit("command_error", {
            message: "Insufficient permissions to send command",
            stationId: data.stationId,
          });
          return;
        }

        // Create command payload
        const commandPayload: CommandPayload = {
          command: data.command,
          ...data.parameters, // Spread parameters into the payload
        };

        // Send command through command container
        const result = await this.commandContainer.service.createAndSendCommand(
          data.stationId,
          commandPayload,
          socket.userId
        );

        // Handle case where result might be null
        if (!result) {
          socket.emit("command_error", {
            message: "Failed to create command",
            stationId: data.stationId,
          });
          return;
        }

        socket.emit("command_sent", {
          commandId: result.id,
          stationId: data.stationId,
          status: result.status,
          timestamp: result.createdAt,
        });

        // Broadcast to station subscribers
        this.io.to(`station:${data.stationId}`).emit("station_command", {
          commandId: result.id,
          command: data.command,
          status: result.status,
          timestamp: result.createdAt,
          issuedBy: socket.userId,
        });
      } catch (error) {
        console.error(`Error sending command:`, error);
        socket.emit("command_error", {
          message: "Failed to send command",
          stationId: data.stationId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Get command status
    socket.on("get_command_status", async (commandId: number) => {
      try {
        if (!socket.userId) {
          socket.emit("command_error", { message: "Authentication required" });
          return;
        }

        const command = await this.commandContainer.service.findCommandById(commandId);
        if (command) {
          socket.emit("command_status", {
            commandId: command.id,
            status: command.status,
            stationId: command.stationId,
            timestamp: command.createdAt,
            executedAt: command.executedAt,
          });
        } else {
          socket.emit("command_error", {
            message: "Command not found",
            commandId,
          });
        }
      } catch (error) {
        console.error(`Error getting command status:`, error);
        socket.emit("command_error", {
          message: "Failed to get command status",
          commandId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Cancel command
    socket.on("cancel_command", async (commandId: number) => {
      try {
        if (!socket.userId || !socket.userRole) {
          socket.emit("command_error", { message: "Authentication required" });
          return;
        }

        // Get command first to check permissions
        const command = await this.commandContainer.service.findCommandById(commandId);
        if (!command) {
          socket.emit("command_error", {
            message: "Command not found",
            commandId,
          });
          return;
        }

        const hasPermission = await this.verifyCommandPermission(socket.userId, socket.userRole, command.stationId);
        if (!hasPermission) {
          socket.emit("command_error", {
            message: "Insufficient permissions to cancel command",
            commandId,
          });
          return;
        }

        const result = await this.commandContainer.service.cancelCommand(commandId);

        // Handle case where result might be null
        if (!result) {
          socket.emit("command_error", {
            message: "Failed to cancel command",
            commandId,
          });
          return;
        }

        socket.emit("command_cancelled", {
          commandId: result.id,
          status: result.status,
        });

        // Broadcast to station subscribers
        this.io.to(`station:${result.stationId}`).emit("station_command_cancelled", {
          commandId: result.id,
          stationId: result.stationId,
        });
      } catch (error) {
        console.error(`Error cancelling command:`, error);
        socket.emit("command_error", {
          message: "Failed to cancel command",
          commandId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Retry command
    socket.on("retry_command", async (commandId: number) => {
      try {
        if (!socket.userId || !socket.userRole) {
          socket.emit("command_error", { message: "Authentication required" });
          return;
        }

        // Get command first to check permissions
        const command = await this.commandContainer.service.findCommandById(commandId);
        if (!command) {
          socket.emit("command_error", {
            message: "Command not found",
            commandId,
          });
          return;
        }

        const hasPermission = await this.verifyCommandPermission(socket.userId, socket.userRole, command.stationId);
        if (!hasPermission) {
          socket.emit("command_error", {
            message: "Insufficient permissions to retry command",
            commandId,
          });
          return;
        }

        const result = await this.commandContainer.service.retryCommand(commandId);

        if (!result) {
          socket.emit("command_error", {
            message: "Failed to retry command",
            commandId,
          });
          return;
        }

        socket.emit("command_retried", {
          commandId: result.id,
          status: result.status,
          timestamp: result.updatedAt,
        });

        // Broadcast to station subscribers
        this.io.to(`station:${result.stationId}`).emit("station_command_retried", {
          commandId: result.id,
          stationId: result.stationId,
          status: result.status,
        });
      } catch (error) {
        console.error(`Error retrying command:`, error);
        socket.emit("command_error", {
          message: "Failed to retry command",
          commandId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Get pending commands for a station
    socket.on("get_pending_commands", async (stationId: number) => {
      try {
        if (!socket.userId || !socket.organizationId) {
          socket.emit("command_error", { message: "Authentication required" });
          return;
        }

        const hasAccess = await this.verifyStationAccess(socket.userId, socket.organizationId, stationId);
        if (!hasAccess) {
          socket.emit("command_error", { message: "Access denied to station" });
          return;
        }

        const pendingCommands = await this.commandContainer.service.getPendingCommandsForStation(stationId);
        socket.emit("pending_commands", {
          stationId,
          commands: pendingCommands,
        });
      } catch (error) {
        console.error(`Error getting pending commands:`, error);
        socket.emit("command_error", {
          message: "Failed to get pending commands",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  private handleNotifications(socket: AuthenticatedSocket): void {
    // Mark notification as read
    socket.on("mark_notification_read", async (notificationId: number) => {
      try {
        if (!socket.userId) {
          socket.emit("notification_error", { message: "Authentication required" });
          return;
        }

        await this.notificationManager.markAsRead(notificationId, socket.userId);
        socket.emit("notification_marked_read", { notificationId });
      } catch (error) {
        console.error(`Error marking notification as read:`, error);
        socket.emit("notification_error", {
          message: "Failed to mark notification as read",
          notificationId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Get unread notification count
    socket.on("get_unread_count", async () => {
      try {
        if (!socket.userId) {
          socket.emit("notification_error", { message: "Authentication required" });
          return;
        }

        const count = await this.notificationManager.getUnreadCount(socket.userId);
        socket.emit("unread_count", { count });
      } catch (error) {
        console.error(`Error getting unread count:`, error);
        socket.emit("notification_error", {
          message: "Failed to get unread count",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Get recent notifications
    socket.on("get_notifications", async (data: { limit?: number; offset?: number } = {}) => {
      try {
        if (!socket.userId) {
          socket.emit("notification_error", { message: "Authentication required" });
          return;
        }

        const notifications = await this.notificationManager.getUserNotifications(
          socket.userId,
          data.limit || 20,
          data.offset || 0
        );
        socket.emit("notifications", { notifications });
      } catch (error) {
        console.error(`Error getting notifications:`, error);
        socket.emit("notification_error", {
          message: "Failed to get notifications",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);

      // Update user presence
      if (socket.userId) {
        this.presenceManager.setUserOffline(socket.userId, socket.id);
      }
    });
  }

  private async verifyStationAccess(userId: number, organizationId: number, stationId: number): Promise<boolean> {
    try {
      const station = await this.stationContainer.service.getStationById(stationId);

      // Check if station exists and belongs to user's organization
      if (!station) {
        return false;
      }

      return station.organizationId === organizationId;
    } catch (error) {
      console.error(`Error verifying station access:`, error);
      return false;
    }
  }

  private async verifyCommandPermission(userId: number, userRole: string, stationId?: number): Promise<boolean> {
    try {
      const allowedRoles = ["admin", "superadmin", "operator"];
      const hasRole = allowedRoles.includes(userRole.toLowerCase());

      // Additional station-specific checks could be added here
      if (stationId && hasRole) {
        // Could check if user has specific permissions for this station
        return true;
      }

      return hasRole;
    } catch (error) {
      console.error(`Error verifying command permission:`, error);
      return false;
    }
  }

  // Public methods for external services to broadcast data
  public broadcastToStation(stationId: number, event: string, data: any): void {
    this.io.to(`station:${stationId}`).emit(event, data);
  }

  public broadcastToOrganization(organizationId: number, event: string, data: any): void {
    this.io.to(`organization:${organizationId}`).emit(event, data);
  }

  public broadcastToUser(userId: number, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Method to handle command execution responses from IoT devices
  public handleCommandResponse(commandId: number, stationId: number, success: boolean, response?: any): void {
    // Update command status
    this.commandContainer.service
      .handleCommandExecutionResponse(commandId, success, response)
      .then((updatedCommand) => {
        // Broadcast command execution result
        this.broadcastToStation(stationId, "command_executed", {
          commandId: updatedCommand.id,
          status: updatedCommand.status,
          success,
          response,
          executedAt: updatedCommand.executedAt,
        });
      })
      .catch((error) => {
        console.error(`Error handling command response:`, error);
      });
  }

  // Method to handle MQTT telemetry data
  public handleMqttTelemetry(stationId: number, payload: any): void {
    this.realTimeDataManager.processMqttMessage(stationId, payload);
  }

  // Method to handle station alerts
  public handleStationAlert(alert: any): void {
    // Broadcast alert to relevant subscribers
    this.broadcastToStation(alert.stationId, "station_alert", alert);
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

  public destroy(): void {
    this.realTimeDataManager.destroy();
    // Clean up other managers if they have destroy methods
  }
}
