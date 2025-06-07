import { PrismaClient } from "@prisma/client";
import { SystemMetricsController } from "./controller";
import { SystemMetricsRepository } from "./repository";
import { SystemMetricsRoutes } from "./route";
import { SystemMetricsService } from "./service";

export class SystemMetricsContainer {
  public readonly repository: SystemMetricsRepository;
  public readonly service: SystemMetricsService;
  public readonly controller: SystemMetricsController;
  public readonly routes: SystemMetricsRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new SystemMetricsRepository(prisma);
    this.service = new SystemMetricsService(this.repository);
    this.controller = new SystemMetricsController(this.service);
    this.routes = new SystemMetricsRoutes(this.controller);
  }
}
