import express, { Application, NextFunction } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { corsOptions, customCors } from "./core/middlewares/cors.middleware";
import { errorHandler } from "./core/middlewares/error-handler.middleware";
import { AppRoutes } from "./route";
import { AppError } from "./core/utils/error";
import http from "http";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./config/database.config";
import { config } from "./config/environment";
import { IoTManager } from "./modules/iot/service";
import { AuthContainer } from "./modules/auth/container";
import { CommandContainer } from "./modules/command/container";
import { OrganizationContainer } from "./modules/organization/container";
import { RootCertificateContainer } from "./modules/root-certificate/container";
import { StationContainer } from "./modules/station/container";
import { StationCertificateContainer } from "./modules/station-certificate/container";
import { TelemetryContainer } from "./modules/telemetry/container";
import { UserContainer } from "./modules/user/container";
import cookieParser from "cookie-parser";

export class App {
  public app: Application;
  public server: http.Server;
  private prisma: PrismaClient;
  private appRoutes!: AppRoutes;
  private awsIotEndpoint: string;

  private authContainer: AuthContainer;
  private commandContainer: CommandContainer;
  private organizationContainer: OrganizationContainer;
  private rootCertificateContainer: RootCertificateContainer;
  private stationContainer: StationContainer;
  private stationCertificateContainer: StationCertificateContainer;
  private telemetryContainer: TelemetryContainer;
  private userContainer: UserContainer;

  private iotManager: IoTManager;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    this.awsIotEndpoint = config.aws.iot.endpoint;

    if (!this.awsIotEndpoint) {
      throw new Error("AWS_IOT_ENDPOINT environment variable is required");
    }

    this.prisma = prisma || new PrismaClient();
    this.authContainer = new AuthContainer(this.prisma);
    this.commandContainer = new CommandContainer(this.prisma);
    this.organizationContainer = new OrganizationContainer(this.prisma);
    this.rootCertificateContainer = new RootCertificateContainer(this.prisma);
    this.stationContainer = new StationContainer(this.prisma);
    this.stationCertificateContainer = new StationCertificateContainer(this.prisma);
    this.telemetryContainer = new TelemetryContainer(this.prisma);
    this.userContainer = new UserContainer(this.prisma);

    this.iotManager = new IoTManager(
      this.stationContainer,
      this.telemetryContainer,
      this.commandContainer,
      this.rootCertificateContainer
    );

    this.stationContainer.setIoTManager(this.iotManager);
    this.stationCertificateContainer.setStationContainer(this.stationContainer);
    this.commandContainer.setIoTManager(this.iotManager);

    this.configureMiddleware();
    this.setupRoutes();
    this.configureErrorHandling();
    this.setupShutdownHandlers();
  }

  private configureMiddleware(): void {
    this.app.use(customCors);
    this.app.options(/(.*)/, cors(corsOptions));
    this.app.use(cookieParser());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.appRoutes = new AppRoutes(
      this.prisma,
      this.authContainer,
      this.commandContainer,
      this.organizationContainer,
      this.rootCertificateContainer,
      this.stationContainer,
      this.stationCertificateContainer,
      this.telemetryContainer,
      this.userContainer
    );

    this.app.use("/api/v1", this.appRoutes.getRouter());
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
      await this.prisma.$connect();
      this.iotManager.initialize();
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
      await this.prisma.$disconnect();
      console.log("Disconnected from database");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }
}

export default new App();
