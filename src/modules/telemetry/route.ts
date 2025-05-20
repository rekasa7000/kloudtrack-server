import { Router } from "express";
import { TelemetryController } from "./controller";

export class TelemetryRoute {
  private router: Router;
  private controller: TelemetryController;

  constructor(telemetryController: TelemetryController) {
    this.router = Router();
    this.controller = telemetryController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/", this.controller.saveTelemetry.bind(this.controller));
    this.router.put("/:id", this.controller.updateTelemetry.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteTelemetry.bind(this.controller));
    this.router.get("/:id", this.controller.findTelemetryById.bind(this.controller));
    this.router.get("/:id", this.controller.findManyTelemetry.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
