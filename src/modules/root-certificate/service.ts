import path from "path";
import fs from "fs";
import { AppError } from "../../core/utils/error";
import {
  getCertificateFingerPrint,
  validateCertificate,
  writeCertificateToFile,
  formatVersion,
  normalizeVersion,
} from "../../core/utils/certificate";
import { RootCertificateRepository } from "./repository";
import { CERTIFICATE_DIR } from "../../core/constants/certificate";

export class RootCertificateService {
  private repository: RootCertificateRepository;

  constructor(rootCertificateRepository: RootCertificateRepository) {
    this.repository = rootCertificateRepository;
  }

  async getRootCertificate() {
    const rootCertificate = await this.repository.findCurrentActiveRoot();

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
    const existingCertificate = await this.repository.findCurrentActiveRoot();

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
        await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
      }

      const rootCertificate = await this.repository.createRoot({
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
      await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
    }

    const rootCertificate = await this.repository.createRoot({
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

    const existingCertificate = await this.repository.findByIdRoot(id);

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

      const updatedCertificate = await this.repository.updateRoot(id, {
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

    const updatedCertificate = await this.repository.updateRoot(id, {
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
    const existingCertificate = await this.repository.findByIdRoot(id);

    if (!existingCertificate) {
      throw new AppError("Root certificate not found", 404);
    }

    if (fs.existsSync(existingCertificate.path)) {
      fs.unlinkSync(existingCertificate.path);
    }

    await this.repository.deleteRoot(id);

    return true;
  }

  async activateRootCertificate(id: string) {
    if (!id) {
      throw new AppError("Certificate ID is required", 400);
    }

    const certificate = await this.repository.findByIdRoot(parseInt(id));

    if (!certificate) {
      throw new AppError("Root certificate not found", 404);
    }

    await this.repository.updateManyStatus("ACTIVE", "INACTIVE");

    const activatedCertificate = await this.repository.updateRoot(parseInt(id), {
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
    const certificates = await this.repository.findAllRoot();

    return certificates.map((cert) => ({
      ...cert,
      version: formatVersion(cert.version),
    }));
  }
}
