import { Router } from "express";
import { protect } from "./core/middlewares/auth.middleware";
import { AuthRoutes } from "./modules/auth/route";
import { StationRoutes } from "./core/services/station/station.route";

export class AppRoutes {
  private router: Router;
  private stationRoutes: StationRoutes;
  private authRoutes: AuthRoutes;
  constructor() {
    this.router = Router();
    this.stationRoutes = new StationRoutes();
    this.authRoutes = new AuthRoutes();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/api/auth", this.authRoutes.getRouter());
    this.router.use("/api/station", protect, this.stationRoutes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
