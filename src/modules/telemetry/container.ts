import { PrismaClient } from "@prisma/client";
import { TelemetryController } from "./controller";
import { TelemetryRepository } from "./repository";
import { TelemetryRoutes } from "./route";
import { TelemetryService } from "./service";

export class TelemetryContainer {
  public readonly repository: TelemetryRepository;
  public readonly service: TelemetryService;
  public readonly controller: TelemetryController;
  public readonly routes: TelemetryRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new TelemetryRepository(prisma);
    this.service = new TelemetryService(this.repository);
    this.controller = new TelemetryController(this.service);
    this.routes = new TelemetryRoutes(this.controller);
  }
}
