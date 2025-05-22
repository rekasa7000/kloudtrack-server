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

export class AppRoutes {
  private router: Router;
  private prisma: PrismaClient;
  private authContainer: AuthContainer;
  private commandContainer: CommandContainer;
  private organizationContainer: OrganizationContainer;
  private rootCertificateContainer: RootCertificateContainer;
  private stationContainer: StationContainer;
  private stationCertificateContainer: StationCertificateContainer;
  private telemetryContainer: TelemetryContainer;
  private userContainer: UserContainer;

  constructor(
    prisma: PrismaClient,
    authContainer: AuthContainer,
    commandContainer: CommandContainer,
    organizationContainer: OrganizationContainer,
    rootCertificateContainer: RootCertificateContainer,
    stationContainer: StationContainer,
    stationCertificateContainer: StationCertificateContainer,
    telemetryContainer: TelemetryContainer,
    userContainer: UserContainer
  ) {
    this.router = Router();
    this.prisma = prisma;

    this.authContainer = authContainer;
    this.commandContainer = commandContainer;
    this.organizationContainer = organizationContainer;
    this.rootCertificateContainer = rootCertificateContainer;
    this.stationContainer = stationContainer;
    this.stationCertificateContainer = stationCertificateContainer;
    this.telemetryContainer = telemetryContainer;
    this.userContainer = userContainer;

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/auth", this.authContainer.routes.getRouter());
    this.router.use("/command", protect, this.commandContainer.routes.getRouter());
    this.router.use("/organization", protect, this.organizationContainer.routes.getRouter());
    this.router.use("/root/certificate", protect, this.rootCertificateContainer.routes.getRouter());
    this.router.use("/station", protect, this.stationContainer.routes.getRouter());
    this.router.use("/station-cert", protect, this.stationCertificateContainer.routes.getRouter());
    this.router.use("/user", protect, this.userContainer.routes.getRouter());
    this.router.use("/telemetry", protect, this.telemetryContainer.routes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
