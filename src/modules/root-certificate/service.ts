import { AppError } from "../../core/utils/error";
import {
  getCertificateFingerPrint,
  validateCertificate,
  formatVersion,
  normalizeVersion,
} from "../../core/utils/certificate";
import { RootCertificateRepository } from "./repository";
import { S3Service, ContentType } from "../../core/service/aws-s3";
import { config } from "../../config/environment";

export class RootCertificateService {
  private repository: RootCertificateRepository;
  private s3Service: S3Service;

  constructor(rootCertificateRepository: RootCertificateRepository) {
    this.repository = rootCertificateRepository;
    this.s3Service = new S3Service({
      bucketName: config.aws.s3.bucketName,
      region: config.aws.region,
    });
  }

  async getRootCertificate() {
    const rootCertificate = await this.repository.findCurrentActiveRoot();

    if (!rootCertificate) {
      throw new AppError("Amazon Root CA certificate record not found", 404);
    }

    const certificateId = this.extractCertificateIdFromPath(rootCertificate.path);
    const rootCA = await this.s3Service.getCertificate(certificateId);

    return {
      id: rootCertificate.id,
      version: formatVersion(rootCertificate.version),
      status: rootCertificate.status,
      path: rootCertificate.path,
      rootCA,
    };
  }

  async createRootCertificate(
    userId: number,
    certificateData: {
      certificateText?: string;
      version?: string;
      certificateId?: string;
      s3Key?: string;
      fileBuffer?: Buffer;
      originalFilename?: string;
      fileSize?: number;
    }
  ) {
    const existingCertificate = await this.repository.findCurrentActiveRoot();

    if (existingCertificate?.version === certificateData.version) {
      throw new AppError(`Version [${certificateData.version}] of certificate is already in the database`, 400);
    }
    if (certificateData.certificateText) {
      const { certificateText, version = "CA1" } = certificateData;

      if (!validateCertificate(certificateText)) {
        throw new AppError("Invalid certificate format", 400);
      }

      const normalizedVersion = normalizeVersion(version);
      const certificateId = `AmazonRoot${formatVersion(normalizedVersion)}`;

      await this.s3Service.uploadCertificate(certificateId, certificateText, {
        version: normalizedVersion,
        "uploaded-by": userId.toString(),
      });

      const fingerprint = getCertificateFingerPrint(certificateText);

      if (existingCertificate) {
        await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
      }

      const s3Key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;

      const s3Location = `https://${this.s3Service.getBucketName()}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

      const rootCertificate = await this.repository.createRoot({
        uploadedByUserId: userId,
        path: s3Key,
        location: s3Location,
        version: normalizedVersion,
        status: "ACTIVE",
      });

      return {
        id: rootCertificate.id,
        version: formatVersion(rootCertificate.version),
        fingerprint,
      };
    }

    const { certificateId, s3Key, version = "CA1", fileBuffer, originalFilename, fileSize } = certificateData;

    if (!fileBuffer || !certificateId || !s3Key) {
      throw new AppError("Root CA certificate file and metadata are required", 400);
    }

    const certificateText = fileBuffer.toString("utf8");

    if (!validateCertificate(certificateText)) {
      throw new AppError("Invalid certificate format", 400);
    }

    const normalizedVersion = normalizeVersion(version);

    await this.s3Service.uploadCertificate(certificateId, certificateText, {
      "original-filename": originalFilename || "",
      "file-size": fileSize?.toString() || "",
      version: normalizedVersion,
      "uploaded-by": userId.toString(),
    });

    const fingerprint = getCertificateFingerPrint(certificateText);

    if (existingCertificate) {
      await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
      if (existingCertificate.path) {
        const oldCertificateId = this.extractCertificateIdFromPath(existingCertificate.path);
        await this.s3Service.deleteCertificate(oldCertificateId);
      }
    }

    const finalS3Key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;
    const s3Location = `https://${this.s3Service.getBucketName()}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

    const rootCertificate = await this.repository.createRoot({
      uploadedByUserId: userId,
      path: finalS3Key,
      location: s3Location,
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
      certificateId?: string;
      s3Key?: string;
      fileBuffer?: Buffer;
      originalFilename?: string;
      fileSize?: number;
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

      const normalizedVersion = version ? normalizeVersion(version) : existingCertificate.version;
      const certificateId = `AmazonRoot${formatVersion(normalizedVersion)}`;
      const newS3Key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;

      if (existingCertificate.path !== newS3Key) {
        const oldCertificateId = this.extractCertificateIdFromPath(existingCertificate.path);
        await this.s3Service.deleteCertificate(oldCertificateId);
      }

      await this.s3Service.uploadCertificate(certificateId, certificateText, {
        version: normalizedVersion,
        "updated-at": new Date().toISOString(),
        location: certificateData.s3Key || "",
      });

      const updatedCertificate = await this.repository.updateRoot(id, {
        path: newS3Key,
        version: normalizedVersion,
        updatedAt: new Date(),
      });

      return {
        id: updatedCertificate.id,
        version: formatVersion(updatedCertificate.version),
      };
    }

    const { certificateId, s3Key, version = "CA1", fileBuffer, originalFilename, fileSize } = certificateData;

    if (!s3Key) {
      throw new AppError("Root CA certificate file or certificate text is required", 400);
    }

    if (!fileBuffer || !certificateId || !s3Key) {
      throw new AppError("Root CA certificate file and metadata are required", 400);
    }

    const normalizedVersion = version ? normalizeVersion(version) : existingCertificate.version;

    const newCertificateText = fileBuffer.toString("utf8");
    const certificateText = await this.s3Service.getObject(existingCertificate.path);

    if (!validateCertificate(newCertificateText)) {
      throw new AppError("Invalid certificate format", 400);
    }

    if (certificateText === newCertificateText) {
      throw new AppError("New certificate has the same content with the current one", 400);
    }

    if (existingCertificate.path !== s3Key) {
      const oldCertificateId = this.extractCertificateIdFromPath(existingCertificate.path);
      await this.s3Service.deleteCertificate(oldCertificateId);
    }

    await this.s3Service.uploadCertificate(certificateId, certificateText, {
      version: normalizedVersion,
      "updated-at": new Date().toISOString(),
      location: certificateData.s3Key || "",
    });

    const s3Location = `https://${this.s3Service.getBucketName()}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

    const updatedCertificate = await this.repository.updateRoot(id, {
      path: s3Key,
      version: normalizedVersion,
      location: s3Location,
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

    if (existingCertificate.path) {
      const certificateId = this.extractCertificateIdFromPath(existingCertificate.path);
      await this.s3Service.deleteCertificate(certificateId);
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

  private extractCertificateIdFromPath(path: string): string {
    const cleanPath = path.startsWith("certificates/") ? path.substring(13) : path;

    const withoutExtension = cleanPath.endsWith(".pem") ? cleanPath.slice(0, -4) : cleanPath;

    return withoutExtension;
  }

  async getCertificateById(certificateId: string): Promise<string> {
    return await this.s3Service.getCertificate(certificateId);
  }

  async certificateExists(certificateId: string): Promise<boolean> {
    const key = `${S3Service.PREFIXES.CERTIFICATES}${certificateId}.pem`;
    return await this.s3Service.objectExists(key);
  }
}
