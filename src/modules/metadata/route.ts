import { Router } from "express";
import { MetadataController } from "./controller";

export class MetadataRoutes {
  private router: Router;
  private controller: MetadataController;

  constructor(metadataController: MetadataController) {
    this.router = Router();
    this.controller = metadataController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.controller.getAll.bind(this.controller));
    this.router.get("/:id", this.controller.getById.bind(this.controller));
    this.router.post("/", this.controller.create.bind(this.controller));
    this.router.put("/:id", this.controller.update.bind(this.controller));
    this.router.delete("/:id", this.controller.delete.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
