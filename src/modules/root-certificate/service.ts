import { AppError } from "../../core/utils/error";
import {
  getCertificateFingerPrint,
  validateCertificate,
  formatVersion,
  normalizeVersion,
} from "../../core/utils/certificate";
import { RootCertificateRepository } from "./repository";
import { s3Client, S3_BUCKET_NAME } from "../../config/aws.config";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export class RootCertificateService {
  private repository: RootCertificateRepository;

  constructor(rootCertificateRepository: RootCertificateRepository) {
    this.repository = rootCertificateRepository;
  }

  private async getS3Object(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const body = response.Body;

      if (!body) {
        throw new AppError("Certificate file not found in S3", 404);
      }

      return await body.transformToString();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Error reading certificate from S3", 500);
    }
  }

  private async putS3Object(key: string, content: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: "application/x-pem-file",
      });

      await s3Client.send(command);
    } catch (error) {
      throw new AppError("Error uploading certificate to S3", 500);
    }
  }

  private async deleteS3Object(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      // Don't throw error if file doesn't exist, just log it
      console.warn(`Could not delete S3 object ${key}:`, error);
    }
  }

  async getRootCertificate() {
    const rootCertificate = await this.repository.findCurrentActiveRoot();

    if (!rootCertificate) {
      throw new AppError("Amazon Root CA certificate record not found", 404);
    }

    // Extract S3 key from the path (assuming path contains the S3 key)
    const s3Key = rootCertificate.path.startsWith("certificates/")
      ? rootCertificate.path
      : `certificates/${rootCertificate.path}`;

    const rootCA = await this.getS3Object(s3Key);

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
      s3Key?: string;
      s3Location?: string;
    }
  ) {
    const existingCertificate = await this.repository.findCurrentActiveRoot();

    if (certificateData.certificateText) {
      const { certificateText, version = "CA1" } = certificateData;

      if (!validateCertificate(certificateText)) {
        throw new AppError("Invalid certificate format", 400);
      }

      const normalizedVersion = normalizeVersion(version);
      const s3Key = `certificates/AmazonRoot${formatVersion(normalizedVersion)}.pem`;

      await this.putS3Object(s3Key, certificateText);
      const fingerprint = getCertificateFingerPrint(certificateText);

      if (existingCertificate) {
        await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
        // Delete old certificate from S3
        if (existingCertificate.path) {
          await this.deleteS3Object(existingCertificate.path);
        }
      }

      const rootCertificate = await this.repository.createRoot({
        uploadedByUserId: userId,
        path: s3Key,
        location: certificateData.s3Location,
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
    const { s3Key, version = "CA1" } = certificateData;
    if (!s3Key) {
      throw new AppError("Root CA certificate file is required", 400);
    }

    const normalizedVersion = normalizeVersion(version);
    const certificateText = await this.getS3Object(s3Key);

    if (!validateCertificate(certificateText)) {
      await this.deleteS3Object(s3Key);
      throw new AppError("Invalid certificate format", 400);
    }

    const fingerprint = getCertificateFingerPrint(certificateText);

    if (existingCertificate) {
      await this.repository.updateManyStatus("ACTIVE", "INACTIVE");
      // Delete old certificate from S3
      if (existingCertificate.path) {
        await this.deleteS3Object(existingCertificate.path);
      }
    }

    const rootCertificate = await this.repository.createRoot({
      uploadedByUserId: userId,
      path: s3Key,
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
      s3Key?: string;
      s3Location?: string;
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
      const s3Key = `certificates/AmazonRoot${formatVersion(normalizedVersion)}.pem`;

      // Delete old certificate if path is different
      if (existingCertificate.path && existingCertificate.path !== s3Key) {
        await this.deleteS3Object(existingCertificate.path);
      }

      await this.putS3Object(s3Key, certificateText);

      const updatedCertificate = await this.repository.updateRoot(id, {
        path: s3Key,
        version: normalizedVersion,
        updatedAt: new Date(),
      });

      return {
        id: updatedCertificate.id,
        version: formatVersion(updatedCertificate.version),
      };
    }

    // File upload case
    const { s3Key, version } = certificateData;
    if (!s3Key) {
      throw new AppError("Root CA certificate file or certificate text is required", 400);
    }

    const normalizedVersion = version ? normalizeVersion(version) : existingCertificate.version;
    const certificateText = await this.getS3Object(s3Key);

    if (!validateCertificate(certificateText)) {
      await this.deleteS3Object(s3Key);
      throw new AppError("Invalid certificate format", 400);
    }

    // Delete old certificate if path is different
    if (existingCertificate.path && existingCertificate.path !== s3Key) {
      await this.deleteS3Object(existingCertificate.path);
    }

    const updatedCertificate = await this.repository.updateRoot(id, {
      path: s3Key,
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

    if (existingCertificate.path) {
      await this.deleteS3Object(existingCertificate.path);
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
