import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database.config";

export interface NotificationData {
  id?: number;
  userId: number;
  organizationId?: number;
  type: "alert" | "info" | "warning" | "success" | "system";
  title: string;
  message: string;
  data?: any;
  priority: "low" | "medium" | "high" | "urgent";
  isRead?: boolean;
  createdAt?: Date;
  expiresAt?: Date;
}

export class NotificationManager {
  private prisma: PrismaClient;

  constructor(private io: SocketIOServer) {
    this.prisma = prisma;
  }

  public async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Save notification to database
      const savedNotification = await this.prisma.notification.create({
        data: {
          userId: notification.userId,
          organizationId: notification.organizationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.stringify(notification.data) : null,
          priority: notification.priority,
          isRead: false,
          expiresAt: notification.expiresAt,
        },
      });

      // Send real-time notification
      this.io.to(`user:${notification.userId}`).emit("notification", {
        id: savedNotification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: savedNotification.createdAt,
        expiresAt: savedNotification.expiresAt,
      });

      // Send to organization if specified
      if (notification.organizationId) {
        this.io.to(`organization:${notification.organizationId}`).emit("organization_notification", {
          id: savedNotification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: savedNotification.createdAt,
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  public async sendBulkNotification(userIds: number[], notification: Omit<NotificationData, "userId">): Promise<void> {
    try {
      // Create notifications for all users
      const notifications = userIds.map((userId) => ({
        userId,
        organizationId: notification.organizationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.stringify(notification.data) : null,
        priority: notification.priority,
        isRead: false,
        expiresAt: notification.expiresAt,
      }));

      const savedNotifications = await this.prisma.notification.createMany({
        data: notifications,
      });

      // Send real-time notifications
      const notificationPayload = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: new Date(),
      };

      userIds.forEach((userId) => {
        this.io.to(`user:${userId}`).emit("notification", {
          ...notificationPayload,
          id: `bulk-${Date.now()}-${userId}`, // Temporary ID for real-time
        });
      });
    } catch (error) {
      console.error("Error sending bulk notification:", error);
      throw error;
    }
  }

  public async sendOrganizationNotification(
    organizationId: number,
    notification: Omit<NotificationData, "userId" | "organizationId">
  ): Promise<void> {
    try {
      // Get all users in the organization
      const users = await this.prisma.user.findMany({
        where: {
          userOrganizations: {
            some: {
              organizationId,
            },
          },
        },
        select: { id: true },
      });

      const userIds = users.map((user) => user.id);

      if (userIds.length > 0) {
        await this.sendBulkNotification(userIds, {
          ...notification,
          organizationId,
        });
      }
    } catch (error) {
      console.error("Error sending organization notification:", error);
      throw error;
    }
  }

  public async markAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  public async markAllAsRead(userId: number): Promise<void> {
    try {
      await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Notify client that all notifications are read
      this.io.to(`user:${userId}`).emit("all_notifications_read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  public async getUnreadCount(userId: number): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  public async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: {
            userId: userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: {
            userId: userId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }),
        this.getUnreadCount(userId),
      ]);

      return {
        notifications: notifications.map((notification) => ({
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null,
        })),
        total,
        unreadCount,
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return { notifications: [], total: 0, unreadCount: 0 };
    }
  }

  // Utility methods for common notification types
  public async sendAlertNotification(
    userId: number,
    title: string,
    message: string,
    data?: any,
    organizationId?: number
  ): Promise<void> {
    await this.sendNotification({
      userId,
      organizationId,
      type: "alert",
      title,
      message,
      data,
      priority: "high",
    });
  }

  public async sendSystemNotification(userId: number, title: string, message: string, data?: any): Promise<void> {
    await this.sendNotification({
      userId,
      type: "system",
      title,
      message,
      data,
      priority: "medium",
    });
  }

  public async sendStationAlert(
    organizationId: number,
    stationId: number,
    stationName: string,
    alertType: string,
    message: string
  ): Promise<void> {
    await this.sendOrganizationNotification(organizationId, {
      type: "alert",
      title: `Station Alert: ${stationName}`,
      message: message,
      data: {
        stationId,
        stationName,
        alertType,
      },
      priority: "urgent",
    });
  }

  // Cleanup expired notifications
  public async cleanupExpiredNotifications(): Promise<void> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired notifications`);
      }
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
    }
  }
}
