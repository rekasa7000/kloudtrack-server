import { PrismaClient } from "@prisma/client";
import { StationCertificateController } from "./controller";
import { StationCertificateRepository } from "./repository";
import { StationCertificateRoutes } from "./route";
import { StationCertificateService } from "./service";
import { StationCertificateUploadService } from "./upload";
import { StationContainer } from "../station/container";

export class StationCertificateContainer {
  public readonly uploadService: StationCertificateUploadService;
  public readonly repository: StationCertificateRepository;
  public readonly service: StationCertificateService;
  public readonly controller: StationCertificateController;
  public readonly routes: StationCertificateRoutes;

  constructor(prisma: PrismaClient) {
    this.uploadService = new StationCertificateUploadService();
    this.repository = new StationCertificateRepository(prisma);
    this.service = new StationCertificateService(this.repository);
    this.controller = new StationCertificateController(this.service);
    this.routes = new StationCertificateRoutes(this.controller, this.uploadService);
  }

  public setStationContainer(stationContainer: StationContainer): void {
    this.service.setStationContainer(stationContainer);
  }
}
