import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import { S3_BUCKET_NAME, s3Client } from "../../config/aws.config";
import { sanitizePathComponent } from "../../core/utils/sanitizer";

interface MulterRequest extends Request {
  body: {
    serialCode?: string;
  };
}

export class StationCertificateUploadService {
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
      const serialCode = req.body.serialCode;

      if (!serialCode) {
        return callback(new Error("No serial code provided"), "");
      }
      const serial = await sanitizePathComponent(serialCode);
      const stationDir = `certificates/${serial}`;

      if (file.fieldname === "key-file" && file.originalname.endsWith("private.pem.key")) {
        const fileName = file.originalname.includes(".pem.") ? file.originalname : `${file.originalname}.pem`;
        return callback(null, `${stationDir}/${fileName}`);
      } else if (file.fieldname === "cert-file" && file.originalname.endsWith("certificate.pem.crt")) {
        const fileName = file.originalname.includes(".pem.") ? file.originalname : `${file.originalname}.pem`;
        return callback(null, `${stationDir}/${fileName}`);
      } else {
        return callback(new Error("Invalid file field or certificate type"), "");
      }
    } catch (error) {
      callback(error, "");
    }
  }

  public uploadStationCertificates() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (
        (file.fieldname === "key-file" && file.originalname.endsWith("private.pem.key")) ||
        (file.fieldname === "cert-file" && file.originalname.endsWith("certificate.pem.crt"))
      ) {
        callback(null, true);
      } else {
        callback(new Error("Invalid file type for the selected field"));
      }
    };

    return multer({
      storage: this.storage,
      fileFilter: fileFilter,
    }).fields([
      { name: "key-file", maxCount: 1 },
      { name: "cert-file", maxCount: 1 },
    ]);
  }
}
