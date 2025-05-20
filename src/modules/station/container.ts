import { PrismaClient } from "@prisma/client";
import { StationRepository } from "./repository";
import { StationService } from "./service";
import { StationController } from "./controller";
import { StationRoutes } from "./route";

export class MetadataContainer {
  public readonly repository: StationRepository;
  public readonly service: StationService;
  public readonly controller: StationController;
  public readonly route: StationRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new StationRepository(prisma);
    this.service = new StationService(this.repository);
    this.controller = new StationController(this.service);
    this.route = new StationRoutes(this.controller);
  }
}
