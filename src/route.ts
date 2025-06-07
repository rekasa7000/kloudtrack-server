import { Router } from "express";
import { StationContainer } from "./modules/station/container";
import { UserContainer } from "./modules/user/container";
import { OrganizationContainer } from "./modules/organization/container";
import { TelemetryContainer } from "./modules/telemetry/container";
import { AuthContainer } from "./modules/auth/container";
import { CommandContainer } from "./modules/command/container";
import { RootCertificateContainer } from "./modules/root-certificate/container";
import { StationCertificateContainer } from "./modules/station-certificate/container";
import { PrismaClient } from "@prisma/client";
import { protect } from "./core/middlewares/auth.middleware";
import { FirmwareContainer } from "./modules/firmware/container";
import { SystemMetricsContainer } from "./modules/system-metrics/container";

export class AppRoutes {
  private router: Router;
  private prisma: PrismaClient;
  private authContainer: AuthContainer;
  private commandContainer: CommandContainer;
  private firmwareContainer: FirmwareContainer;
  private organizationContainer: OrganizationContainer;
  private rootCertificateContainer: RootCertificateContainer;
  private stationContainer: StationContainer;
  private stationCertificateContainer: StationCertificateContainer;
  private systemMetricsContainer: SystemMetricsContainer;
  private telemetryContainer: TelemetryContainer;
  private userContainer: UserContainer;

  constructor(
    prisma: PrismaClient,
    authContainer: AuthContainer,
    commandContainer: CommandContainer,
    firmwarContainer: FirmwareContainer,
    organizationContainer: OrganizationContainer,
    rootCertificateContainer: RootCertificateContainer,
    stationContainer: StationContainer,
    stationCertificateContainer: StationCertificateContainer,
    systemMetricsContainer: SystemMetricsContainer,
    telemetryContainer: TelemetryContainer,
    userContainer: UserContainer
  ) {
    this.router = Router();
    this.prisma = prisma;

    this.authContainer = authContainer;
    this.commandContainer = commandContainer;
    this.firmwareContainer = firmwarContainer;
    this.organizationContainer = organizationContainer;
    this.rootCertificateContainer = rootCertificateContainer;
    this.stationContainer = stationContainer;
    this.stationCertificateContainer = stationCertificateContainer;
    this.systemMetricsContainer = systemMetricsContainer;
    this.telemetryContainer = telemetryContainer;
    this.userContainer = userContainer;

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/auth", this.authContainer.routes.getRouter());
    this.router.use("/command", protect, this.commandContainer.routes.getRouter());
    this.router.use("/firmware", protect, this.firmwareContainer.routes.getRouter());
    this.router.use("/organization", protect, this.organizationContainer.routes.getRouter());
    this.router.use("/root/certificate", protect, this.rootCertificateContainer.routes.getRouter());
    this.router.use("/station", protect, this.stationContainer.routes.getRouter());
    this.router.use("/certificate/station", protect, this.stationCertificateContainer.routes.getRouter());
    this.router.use("/health", protect, this.systemMetricsContainer.routes.getRouter());
    this.router.use("/telemetry", protect, this.telemetryContainer.routes.getRouter());
    this.router.use("/user", protect, this.userContainer.routes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
