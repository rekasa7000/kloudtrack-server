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

export class AppRoutes {
  private router: Router;
  private prisma: PrismaClient;
  private authContainer!: AuthContainer;
  private commandContainer!: CommandContainer;
  private organizationContainer!: OrganizationContainer;
  private rootCertificateContainer!: RootCertificateContainer;
  private stationContainer!: StationContainer;
  private stationCertificateContainer!: StationCertificateContainer;
  private telemetryContainer!: TelemetryContainer;
  private userContainer!: UserContainer;

  constructor(prisma: PrismaClient) {
    this.router = Router();
    this.prisma = prisma;

    this.initializeContainers();
    this.initializeRoutes();
  }

  private initializeContainers(): void {
    this.authContainer = new AuthContainer(this.prisma);
    this.commandContainer = new CommandContainer(this.prisma);
    this.organizationContainer = new OrganizationContainer(this.prisma);
    this.rootCertificateContainer = new RootCertificateContainer(this.prisma);
    this.stationContainer = new StationContainer(this.prisma);
    this.stationCertificateContainer = new StationCertificateContainer(this.prisma);
    this.telemetryContainer = new TelemetryContainer(this.prisma);
    this.userContainer = new UserContainer(this.prisma);
  }

  private initializeRoutes(): void {
    this.router.use("/auth", this.authContainer.routes.getRouter());
    this.router.use("/command", this.commandContainer.routes.getRouter());
    this.router.use("/organization", this.organizationContainer.routes.getRouter());
    this.router.use("/root-cert", this.rootCertificateContainer.routes.getRouter());
    this.router.use("/station", this.stationContainer.routes.getRouter());
    this.router.use("/station-cert", this.stationCertificateContainer.routes.getRouter());
    this.router.use("/user", this.userContainer.routes.getRouter());
    this.router.use("/telemetry", this.telemetryContainer.routes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
