import { PrismaClient } from "@prisma/client";
import { UserController } from "./controller";
import { UserRepository } from "./repository";
import { UserRoutes } from "./route";
import { UserService } from "./service";

export class UserContainer {
  public readonly repository: UserRepository;
  public readonly service: UserService;
  public readonly controller: UserController;
  public readonly routes: UserRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new UserRepository(prisma);
    this.service = new UserService(this.repository);
    this.controller = new UserController(this.service);
    this.routes = new UserRoutes(this.controller);
  }
}
