import { Router } from "express";
import { FirmwareController } from "./controller";
import { FirmwareUploadService } from "./upload";

export class FirmwareRoute {
  private router: Router;
  private controller: FirmwareController;
  private uploadService: FirmwareUploadService;

  constructor(firmwareController: FirmwareController, firmwareUploadService: FirmwareUploadService) {
    this.router = Router();
    this.controller = firmwareController;
    this.uploadService = firmwareUploadService;
    this.initialiazeRoutes();
  }

  private initialiazeRoutes(): void {
    this.router.get("/", this.controller.findManyFirmware.bind(this.controller));
    this.router.get(`/:id`, this.controller.findFirmwareById.bind(this.controller));
    this.router.post("/", this.uploadService.uploadFirmware(), this.controller.createFirmware.bind(this.controller));
    this.router.put(`/:id`, this.controller.updateFirmware.bind(this.controller));
    this.router.delete(`/:id`, this.controller.deleteFirmware.bind(this.controller));
  }

  public getRouter(): Router {
    return this.router;
  }
}
