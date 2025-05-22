import path from "path";
import fs from "fs";
import crypto from "crypto";
import { AppError } from "../../core/utils/error";
import { getCertificateFingerPrint, writeCertificateToFile } from "../../core/utils/certificate";
import { sanitizePathComponent } from "../../core/utils/sanitizer";
import { StationCertificateRepository } from "./repository";
import { config } from "../../config/environment";

export class StationCertificateService {
  private repository: StationCertificateRepository;

  constructor(stationCertificateRepository: StationCertificateRepository) {
    this.repository = stationCertificateRepository;
  }

  async getAllCertificates() {
    const stationCertificates = await this.repository.findAll();

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

    const station = await this.repository.findBySerial(serialCode);

    if (!station) {
      throw new AppError("No station with serial input found", 404);
    }

    const existingCert = await this.repository.findByStationId(station.id);

    if (existingCert) {
      throw new AppError(`Certificate for station ${station.stationName} already exists`, 409);
    }

    const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());

    const stationDir = path.join(config.certificates.rootCaPath, `${namePart}_${sanitizedSerial}`);
    if (!fs.existsSync(stationDir)) {
      fs.mkdirSync(stationDir, { recursive: true });
    }

    const certFileName = `${namePart}_${sanitizedSerial}-certificate.pem.crt`;
    const keyFileName = `${namePart}_${sanitizedSerial}-private.pem.key`;

    const certPath = path.join(stationDir, certFileName);
    const keyPath = path.join(stationDir, keyFileName);

    let fingerprint: string;

    if (certificateContent && privateKeyContent) {
      await writeCertificateToFile(certificateContent, certPath);
      await writeCertificateToFile(privateKeyContent, keyPath);
      fingerprint = getCertificateFingerPrint(certificateContent);
    } else if (certificateData.certFile && certificateData.keyFile) {
      const certificateFile = fs.readFileSync(certificateData.certFile.path);
      fingerprint = crypto.createHash("sha256").update(certificateFile).digest("hex");
    } else {
      throw new AppError("Both Certificate and private key are required", 400);
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const certPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${certFileName}`;
    const keyPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${keyFileName}`;

    const createdCertificate = await this.repository.create({
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

    const existingCert = await this.repository.findByStationId(stationId);

    if (!existingCert) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    if (!existingCert.station) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
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

    const namePart = sanitizePathComponent(existingCert.station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = sanitizePathComponent(existingCert.station.serialCode);
    const stationDir = path.join(config.certificates.rootCaPath, `${namePart}_${sanitizedSerial}`);

    if (!fs.existsSync(stationDir)) {
      fs.mkdirSync(stationDir, { recursive: true });
    }

    let updatedCertificate = false;
    let updatedPrivateKey = false;

    if (certificateContent) {
      const certPath = path.join(process.cwd(), certPathRelative);
      await writeCertificateToFile(certificateContent, certPath);
      updateData.fingerprint = getCertificateFingerPrint(certificateContent);
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateData.expiresAt = expiresAt;
      updatedCertificate = true;
    } else if (certificateData.certFile) {
      const certificateFile = fs.readFileSync(certificateData.certFile.path);
      updateData.fingerprint = crypto.createHash("sha256").update(certificateFile).digest("hex");
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateData.expiresAt = expiresAt;
      updatedCertificate = true;
    }

    if (privateKeyContent) {
      const keyPath = path.join(process.cwd(), keyPathRelative);
      await writeCertificateToFile(privateKeyContent, keyPath);
      updatedPrivateKey = true;
    } else if (certificateData.keyFile) {
      updatedPrivateKey = true;
    }

    if (Object.keys(updateData).length === 0 && !updatedCertificate && !updatedPrivateKey) {
      throw new AppError("No Updates Provided", 400);
    }

    const updatedRecord = await this.repository.update(stationId, updateData);

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

    const existingCert = await this.repository.findByStationId(stationId);

    if (!existingCert) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    if (!existingCert.station) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    await this.repository.delete(stationId);

    const namePart = sanitizePathComponent(existingCert.station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = sanitizePathComponent(existingCert.station.serialCode);

    const stationDir = path.join(config.certificates.rootCaPath, `${namePart}_${sanitizedSerial}`);

    if (fs.existsSync(stationDir)) {
      fs.rmSync(stationDir, { recursive: true, force: true });
    }

    return true;
  }

  async getCertificateByStationId(stationId: number) {
    if (!stationId) {
      throw new AppError("Station id is required", 400);
    }

    const existingCert = await this.repository.findByStationId(stationId);

    if (!existingCert) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    if (!existingCert.station) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    const certificatePath = path.join(process.cwd(), existingCert.certPath);
    const privateKeyPath = path.join(process.cwd(), existingCert.keyPath);

    const hasCertificate = fs.existsSync(certificatePath);
    const hasPrivateKey = fs.existsSync(privateKeyPath);

    if (!hasCertificate || !hasPrivateKey) {
      throw new AppError(
        `One or more required certificate files for station ${existingCert.station.stationName} are missing`,
        404
      );
    }

    const certificateContent = fs.readFileSync(certificatePath, "utf8");
    const privateKeyContent = fs.readFileSync(privateKeyPath, "utf8");

    return {
      id: existingCert.id,
      stationId: existingCert.stationId,
      status: existingCert.status,
      expiresAt: existingCert.expiresAt,
      certificateId: existingCert.awsCertId,
      certificateArn: existingCert.awsCertArn,
      certificate: certificateContent,
      privateKey: privateKeyContent,
    };
  }
}
