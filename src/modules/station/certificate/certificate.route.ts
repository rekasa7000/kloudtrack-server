import { Router } from "express";
import { CertificateController } from "./certificate.controller";
import { CertificateUploadService } from "./certificate-upload.service";
import { validateRequest } from "../../../core/middlewares/validation.middleware";
import {
  activateRootCertificateSchema,
  createRootCertificateSchema,
  deleteRootCertificateSchema,
  stationIdSchema,
  updateCertificateSchema,
  updateRootCertificateSchema,
  uploadCertificateSchema,
} from "./certificate.schema";
import certificateService from "./container";

const rootCertificateRoute: string = "/root";
const certificateRoute: string = "/:stationId";

export class CertificateRoutes {
  private router: Router;
  private certificateController: CertificateController;
  private certificateUploadService: CertificateUploadService;

  constructor() {
    this.router = Router();
    this.certificateController = new CertificateController(certificateService);
    this.certificateUploadService = new CertificateUploadService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(rootCertificateRoute, this.certificateController.listRootCertificates);
    this.router.get(`${rootCertificateRoute}/:id`, this.certificateController.getRootCertificate);
    this.router.post(
      rootCertificateRoute,
      this.certificateUploadService.uploadSingle(),
      validateRequest(createRootCertificateSchema),
      this.certificateController.createRootCertificate
    );
    this.router.put(
      `${rootCertificateRoute}/:id`,
      this.certificateUploadService.uploadSingle(),
      validateRequest(updateRootCertificateSchema),
      this.certificateController.updateRootCertificate
    );
    this.router.delete(
      `${rootCertificateRoute}/:id`,
      validateRequest(deleteRootCertificateSchema),
      this.certificateController.deleteRootCertificate
    );
    this.router.post(
      `${rootCertificateRoute}/:id`,
      validateRequest(activateRootCertificateSchema),
      this.certificateController.activateRootCertificate
    );
    this.router.post(
      certificateRoute,
      this.certificateUploadService.uploadMultiple(),
      validateRequest(uploadCertificateSchema),
      this.certificateController.uploadCertificate
    );
    this.router.put(
      certificateRoute,
      this.certificateUploadService.uploadMultiple(),
      validateRequest(updateCertificateSchema),
      this.certificateController.updateCertificate
    );
    this.router.delete(
      certificateRoute,
      validateRequest(stationIdSchema),
      this.certificateController.deleteCertificate
    );
    this.router.get(
      certificateRoute,
      validateRequest(stationIdSchema),
      this.certificateController.getCertificateByStationId
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
