import { Router } from "express";
import { RootCertificateController } from "./controller";
import { RootCertificateUploadService } from "./upload";
import { validateRequest } from "../../core/middlewares/validation.middleware";
import {
  activateRootCertificateSchema,
  createRootCertificateSchema,
  deleteRootCertificateSchema,
  updateRootCertificateSchema,
} from "./schema";

export class RootCertificateRoutes {
  private router: Router;
  private controller: RootCertificateController;
  private uploadService: RootCertificateUploadService;

  constructor(
    certificateController: RootCertificateController,
    certificateUploadService: RootCertificateUploadService
  ) {
    this.router = Router();
    this.controller = certificateController;
    this.uploadService = certificateUploadService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", this.controller.listRootCertificates);
    this.router.get(`/:id`, this.controller.getRootCertificate);
    this.router.post(
      "/",
      this.uploadService.uploadRootCertificate(),
      validateRequest(createRootCertificateSchema),
      this.controller.createRootCertificate
    );
    this.router.put(
      `/:id`,
      this.uploadService.uploadRootCertificate(),
      validateRequest(updateRootCertificateSchema),
      this.controller.updateRootCertificate
    );
    this.router.delete(`/:id`, validateRequest(deleteRootCertificateSchema), this.controller.deleteRootCertificate);
    this.router.post(`/:id`, validateRequest(activateRootCertificateSchema), this.controller.activateRootCertificate);
  }

  public getRouter(): Router {
    return this.router;
  }
}
