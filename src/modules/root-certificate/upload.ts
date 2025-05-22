import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import { S3_BUCKET_NAME, s3Client } from "../../config/aws.config";

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
    return multerS3({
      s3: s3Client,
      bucket: S3_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: this.generateS3Key.bind(this),
    });
  }

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      if (!file.originalname.endsWith(".pem")) {
        return callback(new Error("Invalid Certificate Type - Only Root CA files are allowed"), "");
      }
      const version = req.body.version || "CA1";
      return callback(null, `certificates/AmazonRoot${version}.pem`);
    } catch (error) {
      callback(error, "");
    }
  }

  public uploadRootCertificate() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (file.originalname.endsWith(".pem")) {
        callback(null, true);
      } else {
        callback(new Error("Only Root CA certificate files are allowed"));
      }
    };

    return multer({
      storage: this.storage,
      fileFilter: fileFilter,
    }).single("root-ca-file");
  }
}
