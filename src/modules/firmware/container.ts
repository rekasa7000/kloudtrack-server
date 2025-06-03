import { PrismaClient } from "@prisma/client";
import { FirmwareController } from "./controller";
import { FirmwareRepository } from "./repository";
import { FirmwareRoute } from "./route.ts";
import { FirmwareService } from "./service";
import { S3Service } from "../../core/service/aws-s3";
import { FirmwareUploadService } from "./upload";

export class FirmwareContainer {
  public readonly uploadService: FirmwareUploadService;
  public readonly repository: FirmwareRepository;
  public readonly service: FirmwareService;
  public readonly controller: FirmwareController;
  public readonly routes: FirmwareRoute;

  constructor(prisma: PrismaClient, s3Service: S3Service) {
    this.uploadService = new FirmwareUploadService();
    this.repository = new FirmwareRepository(prisma);
    this.service = new FirmwareService(this.repository, s3Service);
    this.controller = new FirmwareController(this.service);
    this.routes = new FirmwareRoute(this.controller, this.uploadService);
  }
}
