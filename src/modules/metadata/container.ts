import { PrismaClient } from "@prisma/client";
import { MetadataRepository } from "./repository";
import { MetadataService } from "./service";
import { MetadataController } from "./controller";
import { MetadataRoutes } from "./route";

export class MetadataContainer {
  public readonly repository: MetadataRepository;
  public readonly service: MetadataService;
  public readonly controller: MetadataController;
  public readonly route: MetadataRoutes;

  constructor(prisma: PrismaClient) {
    this.repository = new MetadataRepository(prisma);
    this.service = new MetadataService(this.repository);
    this.controller = new MetadataController(this.service);
    this.route = new MetadataRoutes(this.controller);
  }
}
