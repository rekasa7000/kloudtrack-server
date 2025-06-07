import { Router } from "express";
import { SystemMetricsController } from "./controller";

export class SystemMetricsRoutes {
  private router: Router;
  private controller: SystemMetricsController;

  constructor(controller: SystemMetricsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/current", this.controller.getCurrentHealth);
    this.router.get("/history", this.controller.getHealthHistory);
    this.router.post("/collect", this.controller.forceCollectMetrics);
    this.router.delete("/cleanup", this.controller.cleanupOldMetrics);
  }

  public getRouter(): Router {
    return this.router;
  }
}
