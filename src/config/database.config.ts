import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../core/utils/logger";

class DatabaseManager {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "info" },
          { emit: "event", level: "warn" },
        ],
      }) as PrismaClient<{
        log: [
          { emit: "event"; level: "query" },
          { emit: "event"; level: "error" },
          { emit: "event"; level: "info" },
          { emit: "event"; level: "warn" }
        ];
      }>;

      DatabaseManager.instance.$on("query" as never, (e: Prisma.QueryEvent) => {
        logger.debug("Query: " + e.query);
        logger.debug("Duration: " + e.duration + "ms");
      });

      DatabaseManager.instance.$on("error" as never, (e: Prisma.LogEvent) => {
        logger.error("Database error:", e);
      });

      DatabaseManager.instance.$on("info" as never, (e: Prisma.LogEvent) => {
        logger.info("Database info:", e);
      });

      DatabaseManager.instance.$on("warn" as never, (e: Prisma.LogEvent) => {
        logger.warn("Database warning:", e);
      });
    }

    return DatabaseManager.instance;
  }
}

export const prisma = DatabaseManager.getInstance();
