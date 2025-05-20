import { PrismaClient } from "@prisma/client";
import { RootCertificateController } from "./controller";
import { RootCertificateRepository } from "./repository";
import { RootCertificateRoute } from "./route";
import { RootCertificateService } from "./service";
import { RootCertificateUploadService } from "./upload";

export class StationCertificateContainer {
  public readonly uploadService: RootCertificateUploadService;
  public readonly repository: RootCertificateRepository;
  public readonly service: RootCertificateService;
  public readonly controller: RootCertificateController;
  public readonly route: RootCertificateRoute;

  constructor(prisma: PrismaClient) {
    this.uploadService = new RootCertificateUploadService();
    this.repository = new RootCertificateRepository(prisma);
    this.service = new RootCertificateService(this.repository);
    this.controller = new RootCertificateController(this.service);
    this.route = new RootCertificateRoute(this.controller, this.uploadService);
  }
}
