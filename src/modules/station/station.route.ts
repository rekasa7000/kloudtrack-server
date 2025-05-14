// station.route.ts
import { Router } from "express";
import { MetadataRoutes } from "./metadata/metadata.route";
import { CertificateRoutes } from "./certificate/certificate.route";

export class StationRoutes {
  private router: Router;
  private metadataRoutes: MetadataRoutes;
  private certificateRoutes: CertificateRoutes;

  constructor() {
    this.router = Router();
    this.metadataRoutes = new MetadataRoutes();
    this.certificateRoutes = new CertificateRoutes();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/", this.metadataRoutes.getRouter());
    this.router.use("/certificates", this.certificateRoutes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
