import { CommandRepository } from "./repository";
import { CommandService } from "./service";
import { CommandController } from "./controller";
import { CommandRoutes } from "./route";
import { PrismaClient } from "@prisma/client";

export class CommandContainer {
  public readonly repository: CommandRepository;
  public readonly service: CommandService;
  public readonly controller: CommandController;
  public readonly route: CommandRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new CommandRepository(prisma);
    this.service = new CommandService(this.repository);
    this.controller = new CommandController(this.service);
    this.route = new CommandRoutes(this.controller);
  }
}
