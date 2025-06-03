import { PrismaClient } from "@prisma/client";
import { RootCertificateController } from "./controller";
import { RootCertificateRepository } from "./repository";
import { RootCertificateRoutes } from "./route";
import { RootCertificateService } from "./service";
import { RootCertificateUploadService } from "./upload";
import { S3Service } from "../../core/service/aws-s3";

export class RootCertificateContainer {
  public readonly uploadService: RootCertificateUploadService;
  public readonly repository: RootCertificateRepository;
  public readonly service: RootCertificateService;
  public readonly controller: RootCertificateController;
  public readonly routes: RootCertificateRoutes;

  constructor(prisma: PrismaClient, s3Service: S3Service) {
    this.uploadService = new RootCertificateUploadService();
    this.repository = new RootCertificateRepository(prisma);
    this.service = new RootCertificateService(this.repository, s3Service);
    this.controller = new RootCertificateController(this.service);
    this.routes = new RootCertificateRoutes(this.controller, this.uploadService);
  }
}
