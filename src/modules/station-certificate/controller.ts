import { Request, Response } from "express";
import { sendResponse } from "../../core/utils/response";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { AppError } from "../../core/utils/error";
import { StationCertificateService } from "./service";

export class StationCertificateController {
  private service: StationCertificateService;

  constructor(certificateService: StationCertificateService) {
    this.service = certificateService;
  }

  getAllCertificates = asyncHandler(async (req: Request, res: Response) => {
    const verifiedCertificates = await this.service.getAllCertificates();
    sendResponse(res, verifiedCertificates, 200, "All certificates fetched successfully");
  });

  uploadCertificate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    if (req.body.certificateContent || req.body.privateKeyContent) {
      const { serialCode, certificateContent, privateKeyContent, certificateId, certificateArn } = req.body;

      const result = await this.service.uploadCertificate(req.user.id, {
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

    const result = await this.service.uploadCertificate(req.user.id, {
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

      const result = await this.service.updateCertificate(stationId, {
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

    const result = await this.service.updateCertificate(stationId, {
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
    await this.service.deleteCertificate(stationId);
    sendResponse(res, null, 200, `Certificate deleted successfully`);
  });

  getCertificateByStationId = asyncHandler(async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;
    const certificate = await this.service.getCertificateByStationId(stationId);
    return sendResponse(res, certificate, 200, "Certificate fetched successfully");
  });
}
