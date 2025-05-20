import { Router } from "express";
import { OrganizationController } from "./controller";

export class OrganizationRoute {
  private router: Router;
  private controller: OrganizationController;

  constructor(organizationController: OrganizationController) {
    this.router = Router();
    this.controller = organizationController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/", this.controller.createOrganization.bind(this.controller));
    this.router.put("/:id", this.controller.updateOrganization.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteOrganization.bind(this.controller));
    this.router.get("/:id", this.controller.getOrganizationById.bind(this.controller));
  }
}
