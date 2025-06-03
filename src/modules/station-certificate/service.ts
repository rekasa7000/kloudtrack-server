import crypto from "crypto";
import { AppError } from "../../core/utils/error";
import { getCertificateFingerPrint } from "../../core/utils/certificate";
import { sanitizePathComponent } from "../../core/utils/sanitizer";
import { StationCertificateRepository } from "./repository";
import { config } from "../../config/environment";
import { ContentType, S3Service } from "../../core/service/aws-s3";
import { StationContainer } from "../station/container";

export class StationCertificateService {
  private repository: StationCertificateRepository;
  private s3Service: S3Service;
  private stationContainer?: StationContainer;

  constructor(stationCertificateRepository: StationCertificateRepository, s3Service: S3Service) {
    this.repository = stationCertificateRepository;
    this.s3Service = s3Service;
  }

  public setStationContainer(stationContainer: StationContainer): void {
    this.stationContainer = stationContainer;
  }

  async getAllCertificates() {
    const stationCertificates = await this.repository.findAll();

    const certificatesWithStatus = await Promise.all(
      stationCertificates.map(async (cert) => {
        const certExists = await this.s3Service.objectExists(cert.certPath);
        const keyExists = await this.s3Service.objectExists(cert.keyPath);

        return {
          stationId: cert.stationId,
          status: cert.status,
          expiresAt: cert.expiresAt,
          certificates: {
            certificate: certExists,
            privateKey: keyExists,
          },
        };
      })
    );

    return certificatesWithStatus;
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
      certLocation?: string;
      keyLocation?: string;
    }
  ) {
    const { serialCode, certificateContent, privateKeyContent, certificateId, certificateArn, certFile, keyFile } =
      certificateData;

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

    let certContent: string;
    let keyContent: string;

    if (certificateContent && privateKeyContent) {
      certContent = certificateContent;
      keyContent = privateKeyContent;
    } else if (certFile?.buffer && keyFile?.buffer) {
      certContent = certFile.buffer.toString("utf8");
      keyContent = keyFile.buffer.toString("utf8");
    } else {
      throw new AppError("Both Certificate and private key are required", 400);
    }

    if (!certContent || !keyContent) {
      throw new AppError("Certificate or Key content is missing", 400);
    }

    const fingerprint = getCertificateFingerPrint(certContent);

    const certS3Key = `${sanitizedSerial}-certificate.pem.crt`;
    const keyS3Key = `${sanitizedSerial}-private.pem.key`;

    try {
      await this.s3Service.putObject(certS3Key, certContent, {
        prefix: `${S3Service.PREFIXES.CERTIFICATES}${serialCode}/`,
        contentType: ContentType.CCRT,
        metadata: {
          "station-id": station.id.toString(),
          "station-serial": sanitizedSerial,
          "station-type": station.stationType,
          "certificate-type": "private-key",
          "uploaded-at": new Date().toISOString(),
        },
        tags: {
          Type: "PrivateKey",
          StationId: station.id.toString(),
          Environment: process.env.NODE_ENV || "development",
        },
      });

      await this.s3Service.putObject(keyS3Key, keyContent, {
        prefix: `${S3Service.PREFIXES.CERTIFICATES}${serialCode}/`,
        contentType: ContentType.PEM,
        metadata: {
          "station-id": station.id.toString(),
          "station-serial": sanitizedSerial,
          "station-type": station.stationType,
          "certificate-type": "private-key",
          "uploaded-at": new Date().toISOString(),
        },
        tags: {
          Type: "PrivateKey",
          StationId: station.id.toString(),
          Environment: process.env.NODE_ENV || "development",
        },
      });

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const certPath = `${S3Service.PREFIXES.CERTIFICATES}${serialCode}/${certS3Key}`;
      const keyPath = `${S3Service.PREFIXES.CERTIFICATES}${serialCode}/${keyS3Key}`;
      const certLocation = certFile?.location;
      const keyLocation = keyFile?.location;

      const createdCertificate = await this.repository.create({
        uploadedByUserId: userId,
        stationId: station.id,
        certPath,
        keyPath,
        keyLocation,
        certLocation,
        awsCertId: certificateId || null,
        awsCertArn: certificateArn || null,
        status: "ACTIVE",
        expiresAt,
        fingerprint,
      });

      if (this.stationContainer && createdCertificate.stationId) {
        await this.stationContainer.service.checkAndConnectStation(createdCertificate.stationId);
      }

      return {
        id: createdCertificate.id,
        stationId: station.id,
        certificatePath: certPath,
        privateKeyPath: keyPath,
        certificateFileName: certS3Key,
        privateKeyFileName: keyS3Key,
        status: createdCertificate.status,
        expiresAt: createdCertificate.expiresAt,
      };
    } catch (error) {
      throw new AppError(
        `Failed to upload certificates to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
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

    const existingCertificate = await this.repository.findByStationId(stationId);

    if (!existingCertificate) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    if (!existingCertificate.station) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    const { certificateContent, privateKeyContent, certificateId, certificateArn, status } = certificateData;

    const updateData: any = {};

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

    let updatedCertificate = false;
    let updatedPrivateKey = false;
    console.log(existingCertificate.keyPath);

    const certificateText = await this.s3Service.getObject(existingCertificate.certPath);
    const privateKeyText = await this.s3Service.getObject(existingCertificate.keyPath);
    try {
      if (certificateContent) {
        if (certificateText === certificateContent) {
          throw new AppError("New station certificate and the current one has the same content", 400);
        }

        await this.s3Service.putObject(existingCertificate.certPath, certificateContent, {
          contentType: "application/x-pem-file",
          metadata: {
            "station-id": stationId.toString(),
            "updated-at": new Date().toISOString(),
            "certificate-type": "station-certificate",
          },
        });

        updateData.fingerprint = getCertificateFingerPrint(certificateContent);
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        updateData.expiresAt = expiresAt;
        updatedCertificate = true;
      } else if (certificateData.certFile) {
        const certificateContent = certificateData.certFile.buffer?.toString("utf8") || "";
        if (!certificateContent) {
          throw new AppError("Failed to read certificate file content", 400);
        }
        if (certificateText === certificateContent) {
          throw new AppError("New station certificate and the current one has the same content", 400);
        }

        await this.s3Service.putObject(existingCertificate.certPath, certificateContent, {
          contentType: "application/x-pem-file",
          metadata: {
            "station-id": stationId.toString(),
            "updated-at": new Date().toISOString(),
            "certificate-type": "station-certificate",
          },
        });
        updateData.fingerprint = crypto.createHash("sha256").update(certificateContent).digest("hex");
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        updateData.expiresAt = expiresAt;
        updatedCertificate = true;
      }

      if (privateKeyContent) {
        if (privateKeyContent === privateKeyText) {
          throw new AppError("New station certificate and the current one has the same content", 400);
        }

        await this.s3Service.putObject(existingCertificate.keyPath, privateKeyContent, {
          contentType: "application/x-pem-file",
          metadata: {
            "station-id": stationId.toString(),
            "updated-at": new Date().toISOString(),
            "certificate-type": "private-key",
          },
        });
        updatedPrivateKey = true;
      } else if (certificateData.keyFile) {
        const privateKeyContent = certificateData.keyFile.buffer?.toString("utf8") || "";

        if (!privateKeyContent) {
          throw new AppError("Failed to read private key file content", 400);
        }
        if (privateKeyContent === privateKeyText) {
          throw new AppError("New station certificate and the current one has the same content", 400);
        }

        await this.s3Service.putObject(existingCertificate.keyPath, privateKeyContent, {
          contentType: "application/x-pem-file",
          metadata: {
            "station-id": stationId.toString(),
            "updated-at": new Date().toISOString(),
            "certificate-type": "private-key",
          },
        });
        updatedPrivateKey = true;
      }

      if (Object.keys(updateData).length === 0 && !updatedCertificate && !updatedPrivateKey) {
        throw new AppError("No Updates Provided", 400);
      }

      const updatedRecord = await this.repository.update(stationId, updateData);

      if (this.stationContainer && updatedRecord.stationId) {
        await this.stationContainer.service.checkAndConnectStation(updatedRecord.stationId);
      }
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
    } catch (error) {
      throw new AppError(
        `Failed to update certificates in S3: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
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

    try {
      await Promise.all([
        this.s3Service.deleteObject(existingCert.certPath, false),
        this.s3Service.deleteObject(existingCert.keyPath, false),
        //! DO NOT THROW AN ERROR
      ]);

      await this.repository.delete(stationId);
      if (this.stationContainer && stationId) {
        await this.stationContainer.service.checkAndConnectStation(stationId);
      }
      return true;
    } catch (error) {
      throw new AppError(
        `Failed to delete certificates: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
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

    try {
      const [certExists, keyExists] = await Promise.all([
        this.s3Service.objectExists(existingCert.certPath),
        this.s3Service.objectExists(existingCert.keyPath),
      ]);

      if (!certExists || !keyExists) {
        throw new AppError(
          `One or more required certificate files for station ${existingCert.station.stationName} are missing in S3`,
          404
        );
      }

      const [certificateContent, privateKeyContent] = await Promise.all([
        this.s3Service.getObject(existingCert.certPath),
        this.s3Service.getObject(existingCert.keyPath),
      ]);

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
    } catch (error) {
      throw new AppError(
        `Failed to retrieve certificates from S3: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
  }

  async listAllCertificatesInS3() {
    try {
      const result = await this.s3Service.listObjects({
        prefix: S3Service.PREFIXES.CERTIFICATES,
      });

      return result.objects.map((obj) => ({
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size,
      }));
    } catch (error) {
      throw new AppError(
        `Failed to list certificates in S3: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
  }

  async backupCertificate(stationId: number) {
    const existingCert = await this.repository.findByStationId(stationId);
    if (!existingCert) {
      throw new AppError(`Certificate for station ${stationId} not found`, 404);
    }

    try {
      const [certificateContent, privateKeyContent] = await Promise.all([
        this.s3Service.getObject(existingCert.certPath),
        this.s3Service.getObject(existingCert.keyPath),
      ]);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupCertKey = `backup-${timestamp}-${existingCert.certPath.split("/").pop()}`;
      const backupKeyKey = `backup-${timestamp}-${existingCert.keyPath.split("/").pop()}`;

      await Promise.all([
        this.s3Service.putObject(backupCertKey, certificateContent, {
          prefix: S3Service.PREFIXES.BACKUPS,
          contentType: "application/x-pem-file",
          metadata: {
            "backup-date": timestamp,
            "original-station-id": stationId.toString(),
            "backup-type": "certificate",
          },
        }),
        this.s3Service.putObject(backupKeyKey, privateKeyContent, {
          prefix: S3Service.PREFIXES.BACKUPS,
          contentType: "application/x-pem-file",
          metadata: {
            "backup-date": timestamp,
            "original-station-id": stationId.toString(),
            "backup-type": "private-key",
          },
        }),
      ]);

      return {
        backupCertificatePath: `${S3Service.PREFIXES.BACKUPS}${backupCertKey}`,
        backupPrivateKeyPath: `${S3Service.PREFIXES.BACKUPS}${backupKeyKey}`,
        backupDate: timestamp,
      };
    } catch (error) {
      throw new AppError(
        `Failed to backup certificate: ${error instanceof Error ? error.message : "Unknown error"}`,
        500
      );
    }
  }
}
