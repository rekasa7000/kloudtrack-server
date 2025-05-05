import path from "path";
import fs from "fs";
import crypto from "crypto";
import prisma from "../../../config/database.config";

import { Request, Response } from "express";
import { sendResponse } from "../../../core/utils/response";
import { asyncHandler } from "../../../core/middlewares/error-handler.middleware";
import { AppError } from "../../../core/utils/error";
import { validateStationExists } from "../station.helper";
import {
  CERTIFICATE_DIR,
  CERTIFICATE_TYPES,
} from "../../../config/certificate.config";
import {
  getCertificateFingerPrint,
  upload,
  validateCertificate,
  writeCertificateToFile,
} from "./certificate.helper";
import { formatVersion, normalizeVersion } from "./certificate.utils";
import { sanitizePathComponent } from "../../../core/utils/sanitizer";

// * GET ROOT CERTIFICATE
export const getRootCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const rootCertificate = await prisma.rootCertificate.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!rootCertificate) {
      throw new AppError("Amazon Root CA certificate record not found", 404);
    }

    const rootCAPath = rootCertificate.path.startsWith("/")
      ? rootCertificate.path
      : path.join(process.cwd(), rootCertificate.path);

    if (!fs.existsSync(rootCAPath)) {
      throw new AppError("Amazon Root CA certificate file not found", 404);
    }

    const rootCA = fs.readFileSync(rootCAPath, "utf8");

    return sendResponse(
      res,
      {
        id: rootCertificate.id,
        version: formatVersion(rootCertificate.version),
        status: rootCertificate.status,
        rootCA,
      },
      200,
      "Amazon root certificate fetched successfully"
    );
  }
);

// * UPLOAD ROOT CERTIFICATE
export const createRootCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const existingCertificate = await prisma.rootCertificate.findFirst({
      where: { status: "ACTIVE" },
    });

    if (req.body.certificateText) {
      const { certificateText, version = "CA1" } = req.body;

      if (!validateCertificate(certificateText)) {
        throw new AppError("Invalid certificate format", 400);
      }

      if (!fs.existsSync(CERTIFICATE_DIR)) {
        fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
      }

      const normalizedVersion = normalizeVersion(version);

      const fileName = `AmazonRoot${formatVersion(normalizedVersion)}.pem`;
      const filePath = path.join(CERTIFICATE_DIR, fileName);

      await writeCertificateToFile(certificateText, filePath);

      const fingerprint = getCertificateFingerPrint(certificateText);

      if (existingCertificate) {
        await prisma.rootCertificate.updateMany({
          where: { status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
      }

      const rootCertificate = await prisma.rootCertificate.create({
        data: {
          path: filePath,
          version: normalizedVersion,
          status: "ACTIVE",
        },
      });

      return sendResponse(
        res,
        {
          id: rootCertificate.id,
          version: formatVersion(rootCertificate.version),
          fingerprint,
        },
        201,
        "Amazon Root CA certificate created successfully"
      );
    }

    // * FILE CERTIFICATE UPLOAD
    const uploadRootCA = upload.single(CERTIFICATE_TYPES.ROOT_CA);

    return uploadRootCA(req, res, async (err) => {
      if (err) {
        throw new AppError(err.message, 400);
      }

      if (!req.file) {
        throw new AppError(
          "Root CA certificate file or certificate text is required",
          400
        );
      }

      const { version = "CA1" } = req.body;
      const normalizedVersion = normalizeVersion(version);
      const filePath = req.file.path;

      const certificateText = fs.readFileSync(filePath, "utf8");

      if (!validateCertificate(certificateText)) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new AppError("Invalid certificate format", 400);
      }

      const fingerprint = getCertificateFingerPrint(certificateText);

      if (existingCertificate) {
        await prisma.rootCertificate.updateMany({
          where: { status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
      }

      const rootCertificate = await prisma.rootCertificate.create({
        data: {
          path: filePath,
          version: normalizedVersion,
          status: "ACTIVE",
        },
      });

      return sendResponse(
        res,
        {
          id: rootCertificate.id,
          version: formatVersion(rootCertificate.version),
          fingerprint,
        },
        201,
        "Amazon Root CA certificate uploaded successfully"
      );
    });
  }
);

// * UPDATE ROOT CERTIFICATE
export const updateRootCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const existingCertificate = await prisma.rootCertificate.findUnique({
      where: { id: +id },
    });

    if (!existingCertificate) {
      throw new AppError("Root certificate not found", 404);
    }

    if (req.body.certificateText) {
      const { certificateText, version } = req.body;

      if (!validateCertificate(certificateText)) {
        throw new AppError("Invalid certificate format", 400);
      }

      if (!fs.existsSync(CERTIFICATE_DIR)) {
        fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
      }

      const normalizedVersion = version
        ? normalizeVersion(version)
        : existingCertificate.version;

      const fileName = `AmazonRoot${formatVersion(normalizedVersion)}.pem`;
      const filePath = path.join(CERTIFICATE_DIR, fileName);

      if (
        fs.existsSync(existingCertificate.path) &&
        existingCertificate.path !== filePath
      ) {
        fs.unlinkSync(existingCertificate.path);
      }

      await writeCertificateToFile(certificateText, filePath);

      const updatedCertificate = await prisma.rootCertificate.update({
        where: { id: +id },
        data: {
          path: filePath,
          version: normalizedVersion,
          updatedAt: new Date(),
        },
      });

      return sendResponse(
        res,
        {
          id: updatedCertificate.id,
          version: formatVersion(updatedCertificate.version),
        },
        200,
        "Amazon Root CA certificate updated successfully"
      );
    }
    // * FILE CERTIFICATE UPLOAD
    const uploadRootCA = upload.single(CERTIFICATE_TYPES.ROOT_CA);

    return uploadRootCA(req, res, async (err) => {
      if (err) {
        throw new AppError(err.message, 400);
      }

      if (!req.file) {
        throw new AppError(
          "Root CA certificate file or certificate text is required for update",
          400
        );
      }

      const { version } = req.body;
      const normalizedVersion = version
        ? normalizeVersion(version)
        : existingCertificate.version;
      const filePath = req.file.path;

      const certificateText = fs.readFileSync(filePath, "utf8");
      if (!validateCertificate(certificateText)) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new AppError("Invalid certificate format", 400);
      }

      if (
        fs.existsSync(existingCertificate.path) &&
        existingCertificate.path !== filePath
      ) {
        fs.unlinkSync(existingCertificate.path);
      }
      const updatedCertificate = await prisma.rootCertificate.update({
        where: { id: +id },
        data: {
          path: filePath,
          version: normalizedVersion,
          updatedAt: new Date(),
        },
      });

      return sendResponse(
        res,
        {
          id: updatedCertificate.id,
          version: formatVersion(updatedCertificate.version),
        },
        200,
        "Amazon Root CA certificate updated successfully"
      );
    });
  }
);

// * DELETE ROOT CERTIFICATE
export const deleteRootCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const existingCertificate = await prisma.rootCertificate.findUnique({
      where: { id: +id },
    });

    if (!existingCertificate) {
      throw new AppError("Root certificate not found", 404);
    }

    if (fs.existsSync(existingCertificate.path)) {
      fs.unlinkSync(existingCertificate.path);
    }

    await prisma.rootCertificate.delete({
      where: { id: parseInt(id) },
    });

    return sendResponse(
      res,
      null,
      200,
      "Amazon Root CA certificate deleted successfully"
    );
  }
);

// * ACTIVATE ROOT CERTIFICATE
export const activateRootCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const certificate = await prisma.rootCertificate.findUnique({
      where: { id: parseInt(id) },
    });

    if (!certificate) {
      throw new AppError("Root certificate not found", 404);
    }

    await prisma.rootCertificate.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    const activatedCertificate = await prisma.rootCertificate.update({
      where: { id: +id },
      data: { status: "ACTIVE", updatedAt: new Date() },
    });

    return sendResponse(
      res,
      {
        id: activatedCertificate.id,
        version: formatVersion(activatedCertificate.version),
        status: activatedCertificate.status,
      },
      200,
      "Amazon Root CA certificate activated successfully"
    );
  }
);

// * LIST ALL ROOT CERTIFICATES
export const listRootCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const certificates = await prisma.rootCertificate.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedCertificates = certificates.map((cert) => ({
      ...cert,
      version: formatVersion(cert.version),
    }));

    return sendResponse(
      res,
      formattedCertificates,
      200,
      "Root certificates fetched successfully"
    );
  }
);

// * ALL THING CERTIFICATES
export const getAllCertificates = asyncHandler(
  async (req: Request, res: Response) => {
    const stationCertificates = await prisma.stationCertificate.findMany({
      select: {
        stationId: true,
        certPath: true,
        keyPath: true,
        status: true,
        expiresAt: true,
      },
    });

    const verifiedCertificates = stationCertificates.map((cert) => {
      const certExists = fs.existsSync(path.join(process.cwd(), cert.certPath));
      const keyExists = fs.existsSync(path.join(process.cwd(), cert.keyPath));

      return {
        stationId: cert.stationId,
        status: cert.status,
        expiresAt: cert.expiresAt,
        certificates: {
          certficate: certExists,
          privateKey: keyExists,
        },
      };
    });

    sendResponse(
      res,
      verifiedCertificates,
      200,
      "All certificates fetched successfully"
    );
  }
);

// * UPLOAD THING CERTIFICATE
export const uploadCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.body.certificateContent || req.body.privateKeyContent) {
      const {
        serialCode,
        certificateContent,
        privateKeyContent,
        certificateId,
        certificateArn,
      } = req.body;

      if (!serialCode) {
        throw new AppError("Station Serial is Required", 400);
      }

      const sanitizedSerial = sanitizePathComponent(serialCode);

      if (sanitizedSerial !== serialCode) {
        throw new AppError("Invalid characters in serial code", 400);
      }

      if (!certificateContent || !privateKeyContent) {
        throw new AppError(
          "Both Certificate content and private key content are required",
          400
        );
      }
      const station = await validateStationExists({ serialCode });

      const existingCert = await prisma.stationCertificate.findFirst({
        where: { stationId: station.id },
      });

      if (existingCert) {
        throw new AppError(
          `Certificate for station ${station.stationName} already exists`,
          409
        );
      }
      const namePart = sanitizePathComponent(
        station.stationName.substring(0, 5).toUpperCase()
      );

      const stationDir = path.join(
        CERTIFICATE_DIR,
        `${namePart}_${sanitizedSerial}`
      );
      if (!fs.existsSync(stationDir)) {
        fs.mkdirSync(stationDir, { recursive: true });
      }

      const certFileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
      const keyFileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;

      const certPath = path.join(stationDir, certFileName);
      const keyPath = path.join(stationDir, keyFileName);

      await writeCertificateToFile(certificateContent, certPath);
      await writeCertificateToFile(privateKeyContent, keyPath);

      const fingerprint = getCertificateFingerPrint(certificateContent);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const certPathRelative = `/certificates/${sanitizedSerial}/${certFileName}`;
      const keyPathRelative = `/certificates/${sanitizedSerial}/${keyFileName}`;

      const createdCertificate = await prisma.stationCertificate.create({
        data: {
          stationId: station.id,
          certPath: certPathRelative,
          keyPath: keyPathRelative,
          awsCertId: certificateId || null,
          awsCertArn: certificateArn || null,
          status: "ACTIVE",
          expiresAt,
          fingerprint,
        },
      });

      return sendResponse(res, {
        id: createdCertificate.id,
        stationId: createdCertificate.stationId,
        certificatePath: certPathRelative,
        privateKeyPath: keyPathRelative,
        certificateFileName: certFileName,
        privateKeyFileName: keyFileName,
        status: createdCertificate.status,
        expiresAt: createdCertificate.expiresAt,
      });
    }

    // * FILE THING CERTIFICATE UPLOAD

    const { serialCode, certificateId, certificateArn } = req.body;

    if (!serialCode) {
      throw new AppError("Station Serial is Required", 400);
    }

    const sanitizedSerial = sanitizePathComponent(serialCode);

    if (sanitizedSerial !== serialCode) {
      throw new AppError("Invalid characters in serial code", 400);
    }

    const station = await validateStationExists({ serialCode });

    const existingCert = await prisma.stationCertificate.findFirst({
      where: { stationId: station.id },
    });

    const namePart = sanitizePathComponent(
      station.stationName.substring(0, 5).toUpperCase()
    );

    const certFieldName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
    const keyFieldName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;

    const uploadFields: { name: string; maxCount: number }[] = [
      { name: certFieldName, maxCount: 1 },
      { name: keyFieldName, maxCount: 1 },
    ];

    const uploadFiles = upload.fields(uploadFields);

    uploadFiles(req, res, async (err) => {
      if (err) {
        throw new AppError(err.message, 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files[certFieldName] || !files[keyFieldName]) {
        throw new AppError(
          "Both certificate and private key files are required",
          400
        );
      }

      if (existingCert) {
        throw new AppError(
          `Certificate for station ${station.stationName} already exists`,
          409
        );
      }

      const certificateFile = fs.readFileSync(files[certFieldName][0].path);
      const fingerprint = crypto
        .createHash("sha256")
        .update(certificateFile)
        .digest("hex");

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const certPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${certFieldName}`;
      const keyPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${keyFieldName}`;

      const createdCertificate = await prisma.stationCertificate.create({
        data: {
          stationId: station.id,
          certPath: certPathRelative,
          keyPath: keyPathRelative,
          awsCertId: certificateId || null,
          awsCertArn: certificateArn || null,
          status: "ACTIVE",
          expiresAt,
          fingerprint,
        },
      });

      return sendResponse(res, {
        id: createdCertificate.id,
        stationId: createdCertificate.stationId,
        certificatePath: certPathRelative,
        privateKeyPath: keyPathRelative,
        certificateFileName: certFieldName,
        privateKeyFileName: keyFieldName,
        status: createdCertificate.status,
        expiresAt: createdCertificate.expiresAt,
      });
    });
  }
);

// * UPDATE THING CERTIFICATE
export const updateCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;

    if (!stationId) {
      throw new AppError(`Station Id is Required`, 400);
    }

    const station = await validateStationExists({ stationId });

    const existingCert = await prisma.stationCertificate.findFirst({
      where: { stationId: station.id },
    });

    if (!existingCert) {
      throw new AppError(
        `Certificate for station ${station.stationName} not found`,
        409
      );
    }

    if (req.body.certificateContent || req.body.privateKeyContent) {
      const {
        certificateContent,
        privateKeyContent,
        certificateId,
        certificateArn,
        status,
      } = req.body;

      const updateData: any = {};
      let certPathRelative = existingCert.certPath;
      let keyPathRelative = existingCert.keyPath;

      if (status) {
        if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(status)) {
          throw new AppError(
            "Invalid status value. Must be ACTIVE, INACTIVE, or REVOKED",
            400
          );
        }
        updateData.status = status;
      }

      if (certificateId) {
        updateData.certificateId = certificateId;
      }

      if (certificateArn) {
        updateData.certificateArn = certificateArn;
      }

      const namePart = sanitizePathComponent(
        station.stationName.substring(0, 5).toUpperCase()
      );

      const sanitizedSerial = sanitizePathComponent(station.serialCode);

      const stationDir = path.join(
        CERTIFICATE_DIR,
        `${namePart}_${sanitizedSerial}`
      );
      if (!fs.existsSync(stationDir)) {
        fs.mkdirSync(stationDir, { recursive: true });
      }

      if (certificateContent) {
        const certPath = path.join(process.cwd(), certPathRelative);
        await writeCertificateToFile(certificateContent, certPath);

        updateData.fingerprint = getCertificateFingerPrint(certificateContent);

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        updateData.expirationDate = expiresAt;
      }

      if (privateKeyContent) {
        const keyPath = path.join(process.cwd(), keyPathRelative);
        await writeCertificateToFile(privateKeyContent, keyPath);
      }

      if (Object.keys(updateData).length === 0) {
        throw new AppError("No Updates Provided", 400);
      }

      const updatedCertificate = await prisma.stationCertificate.update({
        where: { stationId: stationId },
        data: updateData,
      });

      return sendResponse(
        res,
        {
          id: updatedCertificate.id,
          stationId: updatedCertificate.stationId,
          status: updatedCertificate.status,
          certificateId: updatedCertificate.awsCertId,
          certificateArn: updatedCertificate.awsCertArn,
          expiresAt: updatedCertificate.expiresAt,
          certificatePath: updatedCertificate.certPath,
          privateKeyPath: updatedCertificate.keyPath,
          updated: {
            certificate: !!certificateContent,
            privateKey: !!privateKeyContent,
            metadata: !!(certificateId || certificateArn || status),
          },
        },
        200,
        `Certificate for thing ${station.stationName} updated successfully`
      );
    }

    // * FILE THING CERTIFICATE UPDATE

    const { certificateId, certificateArn, status } = req.body;

    const namePart = sanitizePathComponent(
      station.stationName.substring(0, 5).toUpperCase()
    );
    const sanitizedSerial = sanitizePathComponent(station.serialCode);

    const stationDir = path.join(
      CERTIFICATE_DIR,
      `${namePart}_${sanitizedSerial}`
    );

    if (!fs.existsSync(stationDir)) {
      fs.mkdirSync(stationDir, { recursive: true });
    }

    const certFieldName = path.basename(existingCert.certPath);
    const keyFieldName = path.basename(existingCert.keyPath);

    const uploadFields: { name: string; maxCount: number }[] = [
      { name: certFieldName, maxCount: 1 },
      { name: keyFieldName, maxCount: 1 },
    ];

    const uploadFiles = upload.fields(uploadFields);

    uploadFiles(req, res, async (err) => {
      if (err) {
        throw new AppError(err.message, 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (
        !files[certFieldName] &&
        !files[keyFieldName] &&
        !certificateId &&
        !certificateArn &&
        !status
      ) {
        throw new AppError("At least one field is required for update", 400);
      }

      const updateData: any = {};

      if (status) {
        if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(status)) {
          throw new AppError(
            "Invalid status value. Must be ACTIVE, INACTIVE, or REVOKED",
            400
          );
        }
        updateData.status = status;
      }

      if (certificateId) {
        updateData.certificateId = certificateId;
      }

      if (certificateArn) {
        updateData.certificateArn = certificateArn;
      }

      if (files[certFieldName]) {
        const certificateFile = fs.readFileSync(files[certFieldName][0].path);
        updateData.fingerprint = crypto
          .createHash("sha256")
          .update(certificateFile)
          .digest("hex");

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        updateData.expiresAt = expiresAt;
      }

      const updatedCertificate = await prisma.stationCertificate.update({
        where: { stationId: station.id },
        data: updateData,
      });

      return sendResponse(
        res,
        {
          id: updatedCertificate.id,
          stationId: updatedCertificate.stationId,
          status: updatedCertificate.status,
          certificateId: updatedCertificate.awsCertId,
          certificateArn: updatedCertificate.awsCertArn,
          expiresAt: updatedCertificate.expiresAt,
          certificatePath: updatedCertificate.certPath,
          privateKeyPath: updatedCertificate.keyPath,
          updated: {
            certificate: !!files[certFieldName],
            privateKey: !!files[keyFieldName],
            metadata: !!(certificateId || certificateArn || status),
          },
        },
        200,
        `Certificate for thing ${station.stationName} updated successfully`
      );
    });
  }
);

// * DELETE CERTIFICATE
export const deleteCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;

    if (!stationId) {
      throw new AppError("Station id is required", 400);
    }

    const station = await validateStationExists({ stationId });

    const existingCert = await prisma.stationCertificate.findUnique({
      where: { stationId: station.id },
    });

    if (!existingCert) {
      throw new AppError(
        `Certificate record for thing ${station.stationName} not found`,
        404
      );
    }

    await prisma.stationCertificate.delete({
      where: { stationId: station.id },
    });

    const namePart = sanitizePathComponent(
      station.stationName.substring(0, 5).toUpperCase()
    );
    const sanitizedSerial = sanitizePathComponent(station.serialCode);

    const stationDir = path.join(
      CERTIFICATE_DIR,
      `${namePart}_${sanitizedSerial}`
    );

    if (fs.existsSync(stationDir)) {
      fs.rmSync(stationDir, { recursive: true, force: true });
    }

    sendResponse(
      res,
      null,
      200,
      `Certificates for thing ${station.stationName} deleted successfully`
    );
  }
);

// * GET CERTIFICATE BY Station Id
export const getCertificateByStationId = asyncHandler(
  async (req: Request, res: Response) => {
    const stationId = +req.params.stationId;

    if (!stationId) {
      throw new AppError("Station id is required", 400);
    }

    const station = await validateStationExists({ stationId });

    const existingCert = await prisma.stationCertificate.findUnique({
      where: { stationId: station.id },
    });

    if (!existingCert) {
      throw new AppError(
        `Certificate record for thing ${station.stationName} not found`,
        404
      );
    }

    const certificate = await prisma.stationCertificate.findUnique({
      where: { stationId: station.id },
    });

    if (!certificate) {
      throw new AppError(
        `Certificate record for station ${station.stationName} not found`,
        404
      );
    }

    const certificatePath = path.join(process.cwd(), certificate.certPath);
    const privateKeyPath = path.join(process.cwd(), certificate.keyPath);

    const hasCertificate = fs.existsSync(certificatePath);
    const hasPrivateKey = fs.existsSync(privateKeyPath);

    if (!hasCertificate || !hasPrivateKey) {
      throw new AppError(
        `One or more required certificate files for station ${station.stationName} are missing`,
        404
      );
    }

    const certificateContent = fs.readFileSync(certificatePath, "utf8");
    const privateKeyContent = fs.readFileSync(privateKeyPath, "utf8");

    return sendResponse(
      res,
      {
        id: certificate.id,
        stationId: certificate.stationId,
        status: certificate.status,
        expiresAt: certificate.expiresAt,
        certificateId: certificate.awsCertId,
        certificateArn: certificate.awsCertArn,
        certificate: certificateContent,
        privateKey: privateKeyContent,
      },
      200,
      "Certificate fetched successfull"
    );
  }
);
