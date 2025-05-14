import path from "path";
import fs from "fs";
import crypto from "crypto";
import prisma from "../../../config/database.config";
import { AppError } from "../../../core/utils/error";
import { validateStationExists } from "../station.helper";
import {
  getCertificateFingerPrint,
  validateCertificate,
  writeCertificateToFile,
  formatVersion,
  normalizeVersion,
} from "./certificate.utils";
import { sanitizePathComponent } from "../../../core/utils/sanitizer";
import { CERTIFICATE_DIR, CERTIFICATE_TYPES } from "./certificate.constant";
import { CertificateRepository } from "./certificate.repository";

export class CertificateService {
  private certificateRepository: CertificateRepository;
  constructor() {
    this.certificateRepository = new CertificateRepository();
  }

  async getRootCertificate() {
    const rootCertificate = await this.certificateRepository.findCurrentActiveRoot();

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

    return {
      id: rootCertificate.id,
      version: formatVersion(rootCertificate.version),
      status: rootCertificate.status,
      rootCA,
    };
  }

  async createRootCertificate(
    userId: number,
    certificateData: {
      certificateText?: string;
      version?: string;
      filePath?: string;
    }
  ) {
    const existingCertificate = await this.certificateRepository.findCurrentActiveRoot();

    if (certificateData.certificateText) {
      const { certificateText, version = "CA1" } = certificateData;

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
        await this.certificateRepository.updateManyStatus("ACTIVE", "INACTIVE");
      }

      const rootCertificate = await this.certificateRepository.createRoot({
        uploadedByUserId: userId,
        path: filePath,
        version: normalizedVersion,
        status: "ACTIVE",
      });

      return {
        id: rootCertificate.id,
        version: formatVersion(rootCertificate.version),
        fingerprint,
      };
    }

    // File upload case
    const { filePath, version = "CA1" } = certificateData;
    if (!filePath) {
      throw new AppError("Root CA certificate file is required", 400);
    }

    const normalizedVersion = normalizeVersion(version);
    const fileName = `AmazonRoot${formatVersion(normalizedVersion)}.pem`;
    const destFilePath = path.join(CERTIFICATE_DIR, fileName);

    const certificateText = fs.readFileSync(filePath, "utf8");

    if (!validateCertificate(certificateText)) {
      if (fs.existsSync(destFilePath)) {
        fs.unlinkSync(destFilePath);
      }
      throw new AppError("Invalid certificate format", 400);
    }

    const fingerprint = getCertificateFingerPrint(certificateText);

    if (existingCertificate) {
      await this.certificateRepository.updateManyStatus("ACTIVE", "INACTIVE");
    }

    const rootCertificate = await this.certificateRepository.createRoot({
      uploadedByUserId: userId,
      path: destFilePath,
      version: normalizedVersion,
      status: "ACTIVE",
    });

    return {
      id: rootCertificate.id,
      version: formatVersion(rootCertificate.version),
      fingerprint,
    };
  }

  async updateRootCertificate(
    id: number,
    certificateData: {
      certificateText?: string;
      version?: string;
      filePath?: string;
    }
  ) {
    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const existingCertificate = await this.certificateRepository.findByIdRoot(id);

    if (!existingCertificate) {
      throw new AppError("Root certificate not found", 404);
    }

    if (certificateData.certificateText) {
      const { certificateText, version } = certificateData;

      if (!validateCertificate(certificateText)) {
        throw new AppError("Invalid certificate format", 400);
      }

      if (!fs.existsSync(CERTIFICATE_DIR)) {
        fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
      }

      const normalizedVersion = version ? normalizeVersion(version) : existingCertificate.version;

      const fileName = `AmazonRoot${formatVersion(normalizedVersion)}.pem`;
      const filePath = path.join(CERTIFICATE_DIR, fileName);

      if (fs.existsSync(existingCertificate.path) && existingCertificate.path !== filePath) {
        fs.unlinkSync(existingCertificate.path);
      }

      await writeCertificateToFile(certificateText, filePath);

      const updatedCertificate = await this.certificateRepository.updateRoot(id, {
        path: filePath,
        version: normalizedVersion,
        updatedAt: new Date(),
      });

      return {
        id: updatedCertificate.id,
        version: formatVersion(updatedCertificate.version),
      };
    }

    // File upload case
    const { filePath, version } = certificateData;
    if (!filePath) {
      throw new AppError("Root CA certificate file or certificate text is required", 400);
    }

    const normalizedVersion = version ? normalizeVersion(version) : existingCertificate.version;
    const certificateText = fs.readFileSync(filePath, "utf8");

    if (!validateCertificate(certificateText)) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new AppError("Invalid certificate format", 400);
    }

    if (fs.existsSync(existingCertificate.path) && existingCertificate.path !== filePath) {
      fs.unlinkSync(existingCertificate.path);
    }

    const updatedCertificate = await this.certificateRepository.updateRoot(id, {
      path: filePath,
      version: normalizedVersion,
      updatedAt: new Date(),
    });

    return {
      id: updatedCertificate.id,
      version: formatVersion(updatedCertificate.version),
    };
  }

  async deleteRootCertificate(id: number) {
    const existingCertificate = await this.certificateRepository.findByIdRoot(id);

    if (!existingCertificate) {
      throw new AppError("Root certificate not found", 404);
    }

    if (fs.existsSync(existingCertificate.path)) {
      fs.unlinkSync(existingCertificate.path);
    }

    await this.certificateRepository.delete(id);

    return true;
  }

  async activateRootCertificate(id: string) {
    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const certificate = await this.certificateRepository.findByIdRoot(parseInt(id));

    if (!certificate) {
      throw new AppError("Root certificate not found", 404);
    }

    await this.certificateRepository.updateManyStatus("ACTIVE", "INACTIVE");

    const activatedCertificate = await this.certificateRepository.updateRoot(parseInt(id), {
      status: "ACTIVE",
      updatedAt: new Date(),
    });

    return {
      id: activatedCertificate.id,
      version: formatVersion(activatedCertificate.version),
      status: activatedCertificate.status,
    };
  }

  async listRootCertificates() {
    const certificates = await this.certificateRepository.findAllRoot();

    return certificates.map((cert) => ({
      ...cert,
      version: formatVersion(cert.version),
    }));
  }

  // * THING CERTIFICATE SERVICES

  async getAllCertificates() {
    const stationCertificates = await this.certificateRepository.findAll();

    return stationCertificates.map((cert) => {
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
  }

  async uploadCertificate(
    userId: number,
    certificateData: {
      serialCode: string;
      certificateContent?: string;
      privateKeyContent?: string;
      certificateId?: string;
      certificateArn?: string;
      certFile?: Express.Multer.File;
      keyFile?: Express.Multer.File;
    }
  ) {
    const { serialCode, certificateContent, privateKeyContent, certificateId, certificateArn } = certificateData;

    if (!serialCode) {
      throw new AppError("Station Serial is Required", 400);
    }

    const sanitizedSerial = sanitizePathComponent(serialCode);

    if (sanitizedSerial !== serialCode) {
      throw new AppError("Invalid characters in serial code", 400);
    }

    const station = await validateStationExists({ serialCode });

    const existingCert = await this.certificateRepository.findByStationId(station.id);

    if (existingCert) {
      throw new AppError(`Certificate for station ${station.stationName} already exists`, 409);
    }

    const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());

    const stationDir = path.join(CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
    if (!fs.existsSync(stationDir)) {
      fs.mkdirSync(stationDir, { recursive: true });
    }

    const certFileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
    const keyFileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;

    const certPath = path.join(stationDir, certFileName);
    const keyPath = path.join(stationDir, keyFileName);

    let fingerprint: string;

    // Handle content-based upload
    if (certificateContent && privateKeyContent) {
      await writeCertificateToFile(certificateContent, certPath);
      await writeCertificateToFile(privateKeyContent, keyPath);
      fingerprint = getCertificateFingerPrint(certificateContent);
    }
    // Handle file-based upload
    else if (certificateData.certFile && certificateData.keyFile) {
      const certificateFile = fs.readFileSync(certificateData.certFile.path);
      fingerprint = crypto.createHash("sha256").update(certificateFile).digest("hex");
    } else {
      throw new AppError("Both Certificate and private key are required", 400);
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const certPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${certFileName}`;
    const keyPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${keyFileName}`;

    const createdCertificate = await this.certificateRepository.create({
      uploadedByUserId: userId,
      stationId: station.id,
      certPath: certPathRelative,
      keyPath: keyPathRelative,
      awsCertId: certificateId || null,
      awsCertArn: certificateArn || null,
      status: "ACTIVE",
      expiresAt,
      fingerprint,
    });

    return {
      id: createdCertificate.id,
      stationId: createdCertificate.stationId,
      certificatePath: certPathRelative,
      privateKeyPath: keyPathRelative,
      certificateFileName: certFileName,
      privateKeyFileName: keyFileName,
      status: createdCertificate.status,
      expiresAt: createdCertificate.expiresAt,
    };
  }

  async updateCertificate(
    stationId: number,
    certificateData: {
      certificateContent?: string;
      privateKeyContent?: string;
      certificateId?: string;
      certificateArn?: string;
      status?: string;
      certFile?: Express.Multer.File;
      keyFile?: Express.Multer.File;
    }
  ) {
    if (!stationId) {
      throw new AppError(`Station Id is Required`, 400);
    }

    const station = await validateStationExists({ stationId });

    const existingCert = await this.certificateRepository.findByStationId(station.id);

    if (!existingCert) {
      throw new AppError(`Certificate for station ${station.stationName} not found`, 409);
    }

    const { certificateContent, privateKeyContent, certificateId, certificateArn, status } = certificateData;

    const updateData: any = {};
    let certPathRelative = existingCert.certPath;
    let keyPathRelative = existingCert.keyPath;

    if (status) {
      if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(status)) {
        throw new AppError("Invalid status value. Must be ACTIVE, INACTIVE, or REVOKED", 400);
      }
      updateData.status = status;
    }

    if (certificateId) {
      updateData.awsCertId = certificateId;
    }

    if (certificateArn) {
      updateData.awsCertArn = certificateArn;
    }

    const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = sanitizePathComponent(station.serialCode);
    const stationDir = path.join(CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);

    if (!fs.existsSync(stationDir)) {
      fs.mkdirSync(stationDir, { recursive: true });
    }

    let updatedCertificate = false;
    let updatedPrivateKey = false;

    // Handle certificate content update
    if (certificateContent) {
      const certPath = path.join(process.cwd(), certPathRelative);
      await writeCertificateToFile(certificateContent, certPath);
      updateData.fingerprint = getCertificateFingerPrint(certificateContent);
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateData.expiresAt = expiresAt;
      updatedCertificate = true;
    }
    // Handle certificate file update
    else if (certificateData.certFile) {
      const certificateFile = fs.readFileSync(certificateData.certFile.path);
      updateData.fingerprint = crypto.createHash("sha256").update(certificateFile).digest("hex");
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateData.expiresAt = expiresAt;
      updatedCertificate = true;
    }

    // Handle private key content update
    if (privateKeyContent) {
      const keyPath = path.join(process.cwd(), keyPathRelative);
      await writeCertificateToFile(privateKeyContent, keyPath);
      updatedPrivateKey = true;
    }
    // Handle private key file update
    else if (certificateData.keyFile) {
      updatedPrivateKey = true;
    }

    if (Object.keys(updateData).length === 0 && !updatedCertificate && !updatedPrivateKey) {
      throw new AppError("No Updates Provided", 400);
    }

    const updatedRecord = await this.certificateRepository.update(stationId, updateData);

    return {
      id: updatedRecord.id,
      stationId: updatedRecord.stationId,
      status: updatedRecord.status,
      certificateId: updatedRecord.awsCertId,
      certificateArn: updatedRecord.awsCertArn,
      expiresAt: updatedRecord.expiresAt,
      certificatePath: updatedRecord.certPath,
      privateKeyPath: updatedRecord.keyPath,
      updated: {
        certificate: updatedCertificate,
        privateKey: updatedPrivateKey,
        metadata: !!(certificateId || certificateArn || status),
      },
    };
  }

  async deleteCertificate(stationId: number) {
    if (!stationId) {
      throw new AppError("Station id is required", 400);
    }

    const station = await validateStationExists({ stationId });

    const existingCert = await this.certificateRepository.findByStationId(station.id);

    if (!existingCert) {
      throw new AppError(`Certificate record for thing ${station.stationName} not found`, 404);
    }

    await this.certificateRepository.delete(station.id);

    const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = sanitizePathComponent(station.serialCode);

    const stationDir = path.join(CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);

    if (fs.existsSync(stationDir)) {
      fs.rmSync(stationDir, { recursive: true, force: true });
    }

    return true;
  }

  async getCertificateByStationId(stationId: number) {
    if (!stationId) {
      throw new AppError("Station id is required", 400);
    }

    const station = await validateStationExists({ stationId });

    const certificate = await this.certificateRepository.findByStationId(station.id);

    if (!certificate) {
      throw new AppError(`Certificate record for station ${station.stationName} not found`, 404);
    }

    const certificatePath = path.join(process.cwd(), certificate.certPath);
    const privateKeyPath = path.join(process.cwd(), certificate.keyPath);

    const hasCertificate = fs.existsSync(certificatePath);
    const hasPrivateKey = fs.existsSync(privateKeyPath);

    if (!hasCertificate || !hasPrivateKey) {
      throw new AppError(`One or more required certificate files for station ${station.stationName} are missing`, 404);
    }

    const certificateContent = fs.readFileSync(certificatePath, "utf8");
    const privateKeyContent = fs.readFileSync(privateKeyPath, "utf8");

    return {
      id: certificate.id,
      stationId: certificate.stationId,
      status: certificate.status,
      expiresAt: certificate.expiresAt,
      certificateId: certificate.awsCertId,
      certificateArn: certificate.awsCertArn,
      certificate: certificateContent,
      privateKey: privateKeyContent,
    };
  }
}
