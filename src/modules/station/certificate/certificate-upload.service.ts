import fs from "fs";
import path from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";

import { CERTIFICATE_DIR, CERTIFICATE_TYPES } from "./certificate.constant";
import { S3_BUCKET_NAME, s3Client } from "../../../config/aws.config";
import config from "../../../config/environment.config";
import { sanitizePathComponent } from "../../../core/utils/sanitizer";
import prisma from "../../../config/database.config";

interface MulterRequest extends Request {
  body: {
    serialCode?: string;
    version?: string;
  };
}

export class CertificateUploadService {
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

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;
      if (!serialCode) return callback(new Error("Serial Code not found"), "");

      const station = await prisma.station.findUnique({ where: { serialCode } });
      if (!station) return callback(new Error("Station not found"), "");

      const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());
      const sanitizedSerial = sanitizePathComponent(serialCode);

      if (
        file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
        file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
      ) {
        const stationDir = `certificates/${namePart}_${sanitizedSerial}`;
        const fileName = file.originalname.includes(".pem.") ? file.originalname : `${file.originalname}.pem`;
        return callback(null, `${stationDir}/${fileName}`);
      } else if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
        const version = req.body.version || "CA1";
        return callback(null, `certificates/AmazonRoot${version}.pem`);
      } else {
        return callback(new Error("Invalid Certificate Type"), "");
      }
    } catch (error) {
      callback(error, "");
    }
  }

  private async getDiskDestination(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;
      if (!serialCode) return callback(new Error("Serial Code not found"), "");

      const station = await prisma.station.findUnique({ where: { serialCode } });
      if (!station) return callback(new Error("Station not found"), "");

      const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());
      const sanitizedSerial = sanitizePathComponent(serialCode);

      if (
        file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
        file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
      ) {
        const stationDir = path.join(CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
        if (!fs.existsSync(stationDir)) fs.mkdirSync(stationDir, { recursive: true });
        return callback(null, stationDir);
      } else if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
        if (!fs.existsSync(CERTIFICATE_DIR)) fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
        return callback(null, CERTIFICATE_DIR);
      } else {
        return callback(new Error("Invalid Certificate Type"), "");
      }
    } catch (error) {
      callback(error, "");
    }
  }

  private async getDiskFilename(req: MulterRequest, file: Express.Multer.File, callback: any) {
    try {
      const serialCode = req.body.serialCode;
      if (!serialCode) return callback(new Error("Serial Code not found"), "");

      const station = await prisma.station.findUnique({ where: { serialCode } });
      if (!station) return callback(new Error("Station not found"), "");

      const namePart = sanitizePathComponent(station.stationType.substring(0, 5).toUpperCase());
      const sanitizedSerial = sanitizePathComponent(serialCode);

      if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
        const version = req.body.version || "CA1";
        return callback(null, `AmazonRoot${version}.pem`);
      }

      let fileName = "";
      if (file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY)) {
        fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;
      } else if (file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)) {
        fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
      }

      callback(null, fileName);
    } catch (error) {
      callback(error, "");
    }
  }

  public uploadSingle() {
    return multer({ storage: this.storage }).single("file");
  }

  public uploadMultiple() {
    return multer({ storage: this.storage }).fields([
      { name: "key-file", maxCount: 1 },
      { name: "cert-file", maxCount: 1 },
    ]);
  }
}
