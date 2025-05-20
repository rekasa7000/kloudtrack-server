import express, { NextFunction } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { corsOptions, customCors } from "./core/middlewares/cors.middleware";
import { errorHandler } from "./core/middlewares/error-handler.middleware";
import { AppRoutes } from "./route";
import { AppError } from "./core/utils/error";
import http from "http";
import { StationModule } from "./core/services/station/station.index";
import prisma from "./config/database.config";
import path from "path";

export async function createApp() {
  const app = express();
  const server = http.createServer(app);

  app.use(customCors);
  app.options(/(.*)/, cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const routes = new AppRoutes();

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  const certificateBasePath = process.env.CERTIFICATE_BASE_PATH || path.join(__dirname, "../certificates");
  const awsIotEndpoint = process.env.AWS_IOT_ENDPOINT || "";

  if (!awsIotEndpoint) {
    throw new Error("AWS_IOT_ENDPOINT environment variable is required");
  }

  const stationModule = new StationModule(prisma, server, certificateBasePath, awsIotEndpoint);

  await stationModule.initialize();

  app.use(routes.getRouter());

  app.use(errorHandler);
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError("Not Found", 404));
  });

  const shutdown = async () => {
    console.log("Shutting down application...");
    await stationModule.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return { app, server, prisma, stationModule };
}
