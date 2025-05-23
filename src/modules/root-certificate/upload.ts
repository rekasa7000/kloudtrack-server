import multer from "multer";
import { Request } from "express";
import { formatVersion, normalizeVersion } from "../../core/utils/certificate";

interface MulterRequest extends Request {
  body: {
    version?: string;
  };
}

export class RootCertificateUploadService {
  private storage: multer.StorageEngine;

  constructor() {
    this.storage = this.createStorageEngine();
  }

  private createStorageEngine(): multer.StorageEngine {
    return multer.memoryStorage();
  }

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File): Promise<string> {
    if (!file.originalname.endsWith(".pem")) {
      throw new Error("Invalid Certificate Type - Only Root CA files are allowed");
    }

    const version = req.body.version || "CA1";
    const normalizedVersion = normalizeVersion(version);
    const formattedVersion = formatVersion(normalizedVersion);

    return `certificates/AmazonRoot${formattedVersion}.pem`;
  }

  private generateCertificateId(version: string): string {
    const normalizedVersion = normalizeVersion(version);
    const formattedVersion = formatVersion(normalizedVersion);
    return `AmazonRoot${formattedVersion}`;
  }

  public uploadRootCertificate() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (file.originalname.endsWith(".pem")) {
        callback(null, true);
      } else {
        callback(new Error("Only Root CA certificate files are allowed"));
      }
    };

    const upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }).single("root-ca-file");

    return async (req: MulterRequest, res: any, next: any) => {
      upload(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          return next(new Error("No file uploaded"));
        }

        try {
          const version = req.body.version || "CA1";
          const s3Key = await this.generateS3Key(req, req.file);
          const certificateId = this.generateCertificateId(version);

          req.file = {
            ...req.file,
            s3Key: s3Key,
            certificateId: certificateId,
            version: normalizeVersion(version),
          } as any;

          next();
        } catch (error) {
          next(error);
        }
      });
    };
  }

  public uploadRootCertificateSpecialized() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (file.originalname.endsWith(".pem")) {
        callback(null, true);
      } else {
        callback(new Error("Only Root CA certificate files are allowed"));
      }
    };

    const upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }).single("root-ca-file");

    return async (req: MulterRequest, res: any, next: any) => {
      upload(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          return next(new Error("No file uploaded"));
        }

        try {
          const version = req.body.version || "CA1";
          const normalizedVersion = normalizeVersion(version);
          const formattedVersion = formatVersion(normalizedVersion);
          const certificateId = `AmazonRoot${formattedVersion}`;

          req.file = {
            ...req.file,
            certificateId: certificateId,
            version: normalizedVersion,
            formattedVersion: formattedVersion,
          } as any;

          next();
        } catch (error) {
          next(error);
        }
      });
    };
  }
}
