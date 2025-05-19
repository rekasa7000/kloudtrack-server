import { Request, Response } from "express";
import { sendResponse } from "../../../core/utils/response";
import { asyncHandler } from "../../../core/middlewares/error-handler.middleware";
import { AppError } from "../../../core/utils/error";
import { CertificateService } from "./certificate.service";

export class CertificateController {
  private certificateService: CertificateService;
  constructor(certificateService: CertificateService) {
    this.certificateService = certificateService;
  }

  getRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const rootCertificate = await this.certificateService.getRootCertificate();
    return sendResponse(res, rootCertificate, 200, "Amazon root certificate fetched successfully");
  });

  createRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (req.body && req.body.certificateText) {
      const { certificateText, version } = req.body;
      const result = await this.certificateService.createRootCertificate(req.user.id, {
        certificateText,
        version,
      });

      return sendResponse(res, result, 201, "Amazon Root CA certificate created successfully");
    }

    if (!req.file) {
      throw new AppError("Root CA certificate file is required", 400);
    }

    const { version } = req.body;
    const result = await this.certificateService.createRootCertificate(req.user.id, {
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
      const result = await this.certificateService.updateRootCertificate(+id, {
        certificateText,
        version,
      });

      return sendResponse(res, result, 200, "Amazon Root CA certificate updated successfully");
    }

    if (!req.file) {
      throw new AppError("Root CA certificate file or certificate text is required", 400);
    }

    const { version } = req.body;
    const result = await this.certificateService.updateRootCertificate(+id, {
      filePath: req.file.path,
      version,
    });

    return sendResponse(res, result, 200, "Amazon Root CA certificate updated successfully");
  });

  deleteRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const id = +req.params.id;
    await this.certificateService.deleteRootCertificate(id);
    return sendResponse(res, null, 200, "Amazon Root CA certificate deleted successfully");
  });

  activateRootCertificate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.certificateService.activateRootCertificate(id);
    return sendResponse(res, result, 200, "Amazon Root CA certificate activated successfully");
  });

  listRootCertificates = asyncHandler(async (req: Request, res: Response) => {
    const certificates = await this.certificateService.listRootCertificates();
    return sendResponse(res, certificates, 200, "Root certificates fetched successfully");
  });

  // * THING CERTIFICATE CONTROLLERS

  getAllCertificates = asyncHandler(async (req: Request, res: Response) => {
    const verifiedCertificates = await this.certificateService.getAllCertificates();
    sendResponse(res, verifiedCertificates, 200, "All certificates fetched successfully");
  });

  uploadCertificate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (req.body.certificateContent || req.body.privateKeyContent) {
      const { serialCode, certificateContent, privateKeyContent, certificateId, certificateArn } = req.body;

      const result = await this.certificateService.uploadCertificate(req.user.id, {
        serialCode,
        certificateContent,
        privateKeyContent,
        certificateId,
        certificateArn,
      });

      return sendResponse(res, result, 201, "Certificate uploaded successfully");
    }

    const { serialCode, certificateId, certificateArn } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files["cert-file"] || !files["key-file"]) {
      throw new AppError("Both certificate and private key files are required", 400);
    }

    const result = await this.certificateService.uploadCertificate(req.user.id, {
      serialCode,
      certificateId,
      certificateArn,
      certFile: files["cert-file"][0],
      keyFile: files["key-file"][0],
    });

    return sendResponse(res, result, 201, "Certificate uploaded successfully");
  });

  updateCertificate = asyncHandler(async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;

    if (req.body.certificateContent || req.body.privateKeyContent) {
      const { certificateContent, privateKeyContent, certificateId, certificateArn, status } = req.body;

      const result = await this.certificateService.updateCertificate(stationId, {
        certificateContent,
        privateKeyContent,
        certificateId,
        certificateArn,
        status,
      });

      return sendResponse(res, result, 200, `Certificate updated successfully`);
    }

    const { certificateId, certificateArn, status } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const result = await this.certificateService.updateCertificate(stationId, {
      certificateId,
      certificateArn,
      status,
      certFile: files && files["cert-file"] ? files["cert-file"][0] : undefined,
      keyFile: files && files["key-file"] ? files["key-file"][0] : undefined,
    });

    return sendResponse(res, result, 200, `Certificate updated successfully`);
  });

  deleteCertificate = asyncHandler(async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;
    await this.certificateService.deleteCertificate(stationId);
    sendResponse(res, null, 200, `Certificate deleted successfully`);
  });

  getCertificateByStationId = asyncHandler(async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;
    const certificate = await this.certificateService.getCertificateByStationId(stationId);
    return sendResponse(res, certificate, 200, "Certificate fetched successfully");
  });
}
