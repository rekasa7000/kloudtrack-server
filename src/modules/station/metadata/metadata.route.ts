import { Router } from "express";
import { MetadataService } from "./metadata.service";
import { MetadataRepository } from "./metadata.repository";
import StationController from "./metadata.controller";
import { registerRoutes } from "../../../core/utils/route-factory";

export class StationRoutes {
  private router: Router;
  private stationController: StationController;

  constructor() {
    this.router = Router();

    const metadataRepository = new MetadataRepository();
    const metadataService = new MetadataService(metadataRepository);
    this.stationController = new StationController(metadataService);

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.stationController.getAll);
    this.router.get("/:id", this.stationController.getById);
    this.router.post("/", this.stationController.create);
    this.router.put("/:id", this.stationController.update);
    this.router.delete("/:id", this.stationController.delete);
  }

  public getRouter(): Router {
    return this.router;
  }
}
