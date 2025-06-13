import { Server as SocketIOServer } from "socket.io";

interface UserPresence {
  userId: number;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  socketIds: Set<string>;
}

interface PresenceData {
  status: "online" | "away" | "offline";
  lastSeen: string;
  socketCount: number;
}

export class PresenceManager {
  private userPresence: Map<number, UserPresence> = new Map();
  private activeUsers: Map<number, number> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private io: SocketIOServer) {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePresence();
    }, 60000);
  }

  public initialize(): void {
    console.log("Presence Manager initialized");
  }

  public async setUserOnline(userId: number, socketId: string): Promise<void> {
    try {
      const presence = this.userPresence.get(userId) || {
        userId,
        status: "online",
        lastSeen: new Date(),
        socketIds: new Set(),
      };

      presence.status = "online";
      presence.lastSeen = new Date();
      presence.socketIds.add(socketId);

      this.userPresence.set(userId, presence);

      // Add to active users with current timestamp
      this.activeUsers.set(userId, Date.now());

      // Broadcast presence update
      this.broadcastPresenceUpdate(userId, "online", presence.lastSeen);
    } catch (error) {
      console.error("Error setting user online:", error);
    }
  }

  public async setUserOffline(userId: number, socketId: string): Promise<void> {
    try {
      const presence = this.userPresence.get(userId);

      if (!presence) return;

      // Remove socket ID
      presence.socketIds.delete(socketId);

      // If no more sockets, set user as offline
      if (presence.socketIds.size === 0) {
        presence.status = "offline";
        presence.lastSeen = new Date();

        // Remove from active users
        this.activeUsers.delete(userId);

        // Broadcast presence update
        this.broadcastPresenceUpdate(userId, "offline", presence.lastSeen);

        // Remove from local cache after delay
        setTimeout(() => {
          this.userPresence.delete(userId);
        }, 5000);
      }
    } catch (error) {
      console.error("Error setting user offline:", error);
    }
  }

  public async updateUserActivity(userId: number): Promise<void> {
    try {
      const presence = this.userPresence.get(userId);

      if (!presence) return;

      const now = new Date();
      presence.lastSeen = now;

      // Update status based on activity
      if (presence.status === "away") {
        presence.status = "online";
        this.broadcastPresenceUpdate(userId, "online", now);
      }

      // Update active users timestamp
      this.activeUsers.set(userId, Date.now());
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  }

  public async updateUserStatus(userId: number, status: string): Promise<void> {
    try {
      const validStatuses = ["online", "away", "offline"];
      if (!validStatuses.includes(status)) {
        return;
      }

      const presence = this.userPresence.get(userId);
      if (!presence) return;

      presence.status = status as "online" | "away" | "offline";
      presence.lastSeen = new Date();

      // Broadcast status update
      this.broadcastPresenceUpdate(userId, presence.status, presence.lastSeen);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  public async getUserPresence(userId: number): Promise<{
    status: string;
    lastSeen: Date;
  } | null> {
    try {
      // Check local cache
      const localPresence = this.userPresence.get(userId);
      if (localPresence) {
        return {
          status: localPresence.status,
          lastSeen: localPresence.lastSeen,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting user presence:", error);
      return null;
    }
  }

  public async getActiveUsers(limit: number = 100): Promise<number[]> {
    try {
      const sortedUsers = Array.from(this.activeUsers.entries())
        .sort(([, timestampA], [, timestampB]) => timestampB - timestampA)
        .slice(0, limit)
        .map(([userId]) => userId);

      return sortedUsers;
    } catch (error) {
      console.error("Error getting active users:", error);
      return [];
    }
  }

  public async getPresenceStats(): Promise<{
    online: number;
    away: number;
    total: number;
  }> {
    try {
      const stats = { online: 0, away: 0, total: 0 };

      // Count from local presence
      for (const presence of this.userPresence.values()) {
        stats.total++;
        if (presence.status === "online") {
          stats.online++;
        } else if (presence.status === "away") {
          stats.away++;
        }
      }

      return stats;
    } catch (error) {
      console.error("Error getting presence stats:", error);
      return { online: 0, away: 0, total: 0 };
    }
  }

  public getAllUserPresences(): Map<number, UserPresence> {
    return new Map(this.userPresence);
  }

  public isUserActive(userId: number): boolean {
    return this.activeUsers.has(userId);
  }

  public getUserLastActivity(userId: number): number | null {
    return this.activeUsers.get(userId) || null;
  }

  private broadcastPresenceUpdate(userId: number, status: string, lastSeen: Date): void {
    this.io.emit("user_presence_update", {
      userId,
      status,
      lastSeen: lastSeen.toISOString(),
    });
  }

  private cleanupStalePresence(): void {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    const awayThreshold = 5 * 60 * 1000; // 5 minutes
    const removeThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [userId, presence] of this.userPresence.entries()) {
      const timeSinceLastSeen = now - presence.lastSeen.getTime();

      if (timeSinceLastSeen > staleThreshold && presence.status !== "offline") {
        // Mark as away if inactive for 5 minutes
        if (timeSinceLastSeen > awayThreshold && presence.status === "online") {
          presence.status = "away";
          this.broadcastPresenceUpdate(userId, "away", presence.lastSeen);
        }

        // Remove if inactive for 30 minutes
        if (timeSinceLastSeen > removeThreshold) {
          this.userPresence.delete(userId);
          this.activeUsers.delete(userId);
        }
      }
    }

    // Also cleanup active users map
    for (const [userId, timestamp] of this.activeUsers.entries()) {
      if (now - timestamp > removeThreshold) {
        this.activeUsers.delete(userId);
      }
    }
  }

  public async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // Clear all data
    this.userPresence.clear();
    this.activeUsers.clear();
  }
}
