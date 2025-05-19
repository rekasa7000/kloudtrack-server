import { Router } from "express";
import { MetadataRoutes } from "./metadata/metadata.route";
import { CertificateRoutes } from "./certificate/certificate.route";
import { CommandRoutes } from "./command/command.route";

export class StationRoutes {
  private router: Router;
  private metadataRoutes: MetadataRoutes;
  private certificateRoutes: CertificateRoutes;
  private commandRoutes: CommandRoutes;

  constructor() {
    this.router = Router();
    this.metadataRoutes = new MetadataRoutes();
    this.certificateRoutes = new CertificateRoutes();
    this.commandRoutes = new CommandRoutes();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/", this.metadataRoutes.getRouter());
    this.router.use("/certificate", this.certificateRoutes.getRouter());
    this.router.use("/command", this.commandRoutes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
