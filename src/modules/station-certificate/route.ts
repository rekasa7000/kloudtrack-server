import { Router } from "express";
import { StationCertificateController } from "./controller";
import { StationCertificateUploadService } from "./upload";
import { validateRequest } from "../../core/middlewares/validation.middleware";
import { stationIdSchema, updateCertificateSchema, uploadCertificateSchema } from "./schema";

const certificateRoute: string = "/:stationId";

export class StationCertificateRoutes {
  private router: Router;
  private controller: StationCertificateController;
  private uploadService: StationCertificateUploadService;

  constructor(
    stationCertificateController: StationCertificateController,
    stationCertificateUploadService: StationCertificateUploadService
  ) {
    this.router = Router();
    this.controller = stationCertificateController;
    this.uploadService = stationCertificateUploadService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      certificateRoute,
      this.uploadService.uploadStationCertificates(),
      validateRequest(uploadCertificateSchema),
      this.controller.uploadCertificate
    );
    this.router.put(
      certificateRoute,
      this.uploadService.uploadStationCertificates(),
      validateRequest(updateCertificateSchema),
      this.controller.updateCertificate
    );
    this.router.delete(certificateRoute, validateRequest(stationIdSchema), this.controller.deleteCertificate);
    this.router.get(certificateRoute, validateRequest(stationIdSchema), this.controller.getCertificateByStationId);
  }

  public getRouter(): Router {
    return this.router;
  }
}
