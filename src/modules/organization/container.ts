import { PrismaClient } from "@prisma/client";
import { OrganizationController } from "./controller";
import { OrganizationRepository } from "./repository";
import { OrganizationRoutes } from "./route";
import { OrganizationService } from "./service";

export class OrganizationContainer {
  public readonly repository: OrganizationRepository;
  public readonly service: OrganizationService;
  public readonly controller: OrganizationController;
  public readonly routes: OrganizationRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new OrganizationRepository(prisma);
    this.service = new OrganizationService(this.repository);
    this.controller = new OrganizationController(this.service);
    this.routes = new OrganizationRoutes(this.controller);
  }
}
