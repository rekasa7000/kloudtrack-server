import { PrismaClient } from "@prisma/client";
import { StationRepository } from "./repository";
import { StationService } from "./service";
import { StationController } from "./controller";
import { StationRoutes } from "./route";
import { IoTManager } from "../../core/iot/iot.manager";

export class StationContainer {
  public readonly repository: StationRepository;
  public readonly service: StationService;
  public readonly controller: StationController;
  public readonly routes: StationRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new StationRepository(prisma);
    this.service = new StationService(this.repository);
    this.controller = new StationController(this.service);
    this.routes = new StationRoutes(this.controller);
  }

  public setIoTManager(iotManager: IoTManager): void {
    this.service.setIoTManager(iotManager);
  }
}
