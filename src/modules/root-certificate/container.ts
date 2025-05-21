import { PrismaClient } from "@prisma/client";
import { RootCertificateController } from "./controller";
import { RootCertificateRepository } from "./repository";
import { RootCertificateRoutes } from "./route";
import { RootCertificateService } from "./service";
import { RootCertificateUploadService } from "./upload";

export class RootCertificateContainer {
  public readonly uploadService: RootCertificateUploadService;
  public readonly repository: RootCertificateRepository;
  public readonly service: RootCertificateService;
  public readonly controller: RootCertificateController;
  public readonly routes: RootCertificates;

  constructor(prisma: PrismaClient) {
    this.uploadService = new RootCertificateUploadService();
    this.repository = new RootCertificateRepository(prisma);
    this.service = new RootCertificateService(this.repository);
    this.controller = new RootCertificateController(this.service);
    this.routes = new RootCertificateRoutes(this.controller, this.uploadService);
  }
}
