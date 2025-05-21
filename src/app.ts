import express, { Application, NextFunction } from "express";
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
import { PrismaClient } from "@prisma/client";

export class App {
  public app: Application;
  public server: http.Server;
  private prisma: PrismaClient;
  private appRoutes!: AppRoutes;
  // private stationModule: StationModule;
  private certificateBasePath: string;
  private awsIotEndpoint: string;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    this.certificateBasePath = process.env.CERTIFICATE_BASE_PATH || path.join(__dirname, "../certificates");
    this.awsIotEndpoint = process.env.AWS_IOT_ENDPOINT || "";

    if (!this.awsIotEndpoint) {
      throw new Error("AWS_IOT_ENDPOINT environment variable is required");
    }

    this.prisma = prisma || new PrismaClient();

    // this.stationModule = new StationModule(
    //   this.prisma,
    //   this.server,
    //   this.certificateBasePath,
    //   this.awsIotEndpoint
    // );

    this.configureMiddleware();
    this.setupRoutes();
    this.configureErrorHandling();

    this.setupShutdownHandlers();
  }

  private configureMiddleware(): void {
    this.app.use(customCors);
    this.app.options(/(.*)/, cors(corsOptions));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.appRoutes = new AppRoutes(this.prisma);

    this.app.use(this.appRoutes.getRouter());
  }

  private configureErrorHandling(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new AppError("Not Found", 404));
    });

    this.app.use(errorHandler);
  }

  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      console.log("Shutting down application...");
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  public async initialize(): Promise<void> {
    try {
      await this.stationModule.initialize();

      await this.prisma.$connect();
      console.log("Connected to database successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      await this.stop();
      throw error;
    }
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      await this.initialize();

      this.server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      await this.stop();
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.stationModule) {
        await this.stationModule.close();
      }

      await this.prisma.$disconnect();
      console.log("Disconnected from database");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }
}

export default new App();
