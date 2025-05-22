import fs from "fs";
import path from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";

import { CERTIFICATE_DIR, CERTIFICATE_TYPES } from "../../core/constants/certificate";
import { S3_BUCKET_NAME, s3Client } from "../../config/aws.config";
import config from "../../config/environment";
import { sanitizePathComponent } from "../../core/utils/sanitizer";
import prisma from "../../config/database.config";

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
    return config.NODE_ENV === "production"
      ? multerS3({
          s3: s3Client,
          bucket: S3_BUCKET_NAME,
          contentType: multerS3.AUTO_CONTENT_TYPE,
          key: this.generateS3Key.bind(this),
        })
      : multer.diskStorage({
          destination: this.getDiskDestination.bind(this),
          filename: this.getDiskFilename.bind(this),
        });
  }

  private async validateStation(serialCode: string | undefined) {
    if (!serialCode) {
      throw new Error("Serial Code not found");
    }

    const station = await prisma.station.findUnique({ where: { serialCode } });
    if (!station) {
      throw new Error("Station not found");
    }

    return {
      namePart: sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase()),
      sanitizedSerial: sanitizePathComponent(serialCode),
    };
  }

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;

      const { namePart, sanitizedSerial } = await this.validateStation(serialCode);
      const stationDir = `certificates/${namePart}_${sanitizedSerial}`;

      if (file.fieldname === "key-file" && file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY)) {
        const fileName = file.originalname.includes(".pem.") ? file.originalname : `${file.originalname}.pem`;
        return callback(null, `${stationDir}/${fileName}`);
      } else if (file.fieldname === "cert-file" && file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)) {
        const fileName = file.originalname.includes(".pem.") ? file.originalname : `${file.originalname}.pem`;
        return callback(null, `${stationDir}/${fileName}`);
      } else {
        return callback(new Error("Invalid file field or certificate type"), "");
      }
    } catch (error) {
      callback(error, "");
    }
  }

  private async getDiskDestination(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;

      const { namePart, sanitizedSerial } = await this.validateStation(serialCode);
      const stationDir = path.join(CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);

      if (!fs.existsSync(stationDir)) {
        fs.mkdirSync(stationDir, { recursive: true });
      }

      return callback(null, stationDir);
    } catch (error) {
      callback(error, "");
    }
  }

  private async getDiskFilename(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;

      const { namePart, sanitizedSerial } = await this.validateStation(serialCode);

      let fileName = "";
      if (file.fieldname === "key-file" && file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY)) {
        fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;
      } else if (file.fieldname === "cert-file" && file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)) {
        fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
      } else {
        return callback(new Error("Invalid file field or certificate type"), "");
      }

      callback(null, fileName);
    } catch (error) {
      callback(error, "");
    }
  }

  public uploadStationCertificates() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (
        (file.fieldname === "key-file" && file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY)) ||
        (file.fieldname === "cert-file" && file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE))
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
