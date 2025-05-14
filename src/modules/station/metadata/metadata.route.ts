import { Router } from "express";
import { MetadataController } from "./metadata.controller";

export class MetadataRoutes {
  private router: Router;
  private metadataController: MetadataController;

  constructor() {
    this.router = Router();
    this.metadataController = new MetadataController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.metadataController.getAll.bind(this.metadataController));
    this.router.get("/:id", this.metadataController.getById.bind(this.metadataController));
    this.router.post("/", this.metadataController.create.bind(this.metadataController));
    this.router.put("/:id", this.metadataController.update.bind(this.metadataController));
    this.router.delete("/:id", this.metadataController.delete.bind(this.metadataController));
  }

  public getRouter(): Router {
    return this.router;
  }
}
