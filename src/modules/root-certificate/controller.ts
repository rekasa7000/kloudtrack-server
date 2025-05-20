import { Request, Response } from "express";
import { sendResponse } from "../../core/utils/response";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { AppError } from "../../core/utils/error";
import { RootCertificateService } from "./service";

export class RootCertificateController {
  private service: RootCertificateService;

  constructor(rootCertificateService: RootCertificateService) {
    this.service = rootCertificateService;
  }

  getRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const rootCertificate = await this.service.getRootCertificate();
    return sendResponse(res, rootCertificate, 200, "Amazon root certificate fetched successfully");
  });

  createRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (req.body && req.body.certificateText) {
      const { certificateText, version } = req.body;
      const result = await this.service.createRootCertificate(req.user.id, {
        certificateText,
        version,
      });

      return sendResponse(res, result, 201, "Amazon Root CA certificate created successfully");
    }

    if (!req.file) {
      throw new AppError("Root CA certificate file is required", 400);
    }

    const { version } = req.body;
    const result = await this.service.createRootCertificate(req.user.id, {
      filePath: req.file.path,
      version,
    });

    return sendResponse(res, result, 201, "Amazon Root CA certificate uploaded successfully");
  });

  updateRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    if (req.body && req.body.certificateText) {
      const { certificateText, version } = req.body;
      const result = await this.service.updateRootCertificate(+id, {
        certificateText,
        version,
      });

      return sendResponse(res, result, 200, "Amazon Root CA certificate updated successfully");
    }

    if (!req.file) {
      throw new AppError("Root CA certificate file or certificate text is required", 400);
    }

    const { version } = req.body;
    const result = await this.service.updateRootCertificate(+id, {
      filePath: req.file.path,
      version,
    });

    return sendResponse(res, result, 200, "Amazon Root CA certificate updated successfully");
  });

  deleteRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const id = +req.params.id;
    await this.service.deleteRootCertificate(id);
    return sendResponse(res, null, 200, "Amazon Root CA certificate deleted successfully");
  });

  activateRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.activateRootCertificate(id);
    return sendResponse(res, result, 200, "Amazon Root CA certificate activated successfully");
  });

  listRootCertificates = asyncHandler(async (req: Request, res: Response) => {
    const certificates = await this.service.listRootCertificates();
    return sendResponse(res, certificates, 200, "Root certificates fetched successfully");
  });
}
