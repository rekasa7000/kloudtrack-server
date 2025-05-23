import { Router } from "express";
import { StationController } from "./controller";
import { restrictTo } from "../../core/middlewares/auth.middleware";

export class StationRoutes {
  private router: Router;
  private controller: StationController;

  constructor(stationController: StationController) {
    this.router = Router();
    this.controller = stationController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", restrictTo("SUPERADMIN"), this.controller.getAll.bind(this.controller));
    this.router.get("/:id", this.controller.getById.bind(this.controller));
    this.router.post("/", restrictTo("SUPERADMIN"), this.controller.create.bind(this.controller));
    this.router.post(
      "/:id/activate",
      restrictTo("SUPERADMIN", "ADMIN"),
      this.controller.activateStation.bind(this.controller)
    );
    this.router.put("/:id", restrictTo("SUPERADMIN"), this.controller.update.bind(this.controller));
    this.router.delete("/:id", restrictTo("SUPERADMIN"), this.controller.delete.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
