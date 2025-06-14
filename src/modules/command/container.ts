import { CommandRepository } from "./repository";
import { CommandService } from "./service";
import { CommandController } from "./controller";
import { CommandRoutes } from "./route";
import { PrismaClient } from "@prisma/client";
import { IoTManager } from "../../core/iot/iot.manager";

export class CommandContainer {
  public readonly repository: CommandRepository;
  public readonly service: CommandService;
  public readonly controller: CommandController;
  public readonly routes: CommandRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new CommandRepository(prisma);
    this.service = new CommandService(this.repository);
    this.controller = new CommandController(this.service);
    this.routes = new CommandRoutes(this.controller);
  }

  public setIoTManager(iotManager: IoTManager): void {
    this.service.setIoTManager(iotManager);
  }
}
