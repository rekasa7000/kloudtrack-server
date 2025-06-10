import { Router } from "express";
import { OrganizationController } from "./controller";
import { OrganizationUpload } from "./upload";

export class OrganizationRoutes {
  private router: Router;
  private controller: OrganizationController;
  private upload: OrganizationUpload;

  constructor(organizationController: OrganizationController) {
    this.router = Router();
    this.upload = new OrganizationUpload();
    this.controller = organizationController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      this.upload.uploadOrganizationPicture(),
      this.controller.createOrganization.bind(this.controller)
    );
    this.router.get("/search", this.controller.searchOrganizations.bind(this.controller));
    this.router.get("/", this.controller.getOrganizations.bind(this.controller));
    this.router.get("/all", this.controller.getAllOrganizations.bind(this.controller));
    this.router.put("/:id", this.controller.updateOrganization.bind(this.controller));
    this.router.delete("/:id", this.controller.deleteOrganization.bind(this.controller));
    this.router.get("/:id", this.controller.getOrganizationById.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
