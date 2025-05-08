import fs from "fs";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { CERTIFICATE_DIR, CERTIFICATE_TYPES } from "./certificate.constant";
import config from "../../../config/environment.config";
import { S3_BUCKET_NAME, s3Client } from "../../../config/aws.config";
import { Request } from "express";
import { sanitizePathComponent } from "../../../core/utils/sanitizer";
import prisma from "../../../config/database.config";

interface MulterRequest extends Request {
  body: {
    serial?: string;
    version?: string;
  };
}

const storage =
  config.NODE_ENV === "production"
    ? multerS3({
        s3: s3Client,
        bucket: S3_BUCKET_NAME,
        key: (req: MulterRequest, file, callback) => {
          const serial = req.body.serial;

          if (
            file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
            file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
          ) {
            const stationDir = `certificates/${serial}`;
            const fileName = file.originalname.includes(".pem.")
              ? file.originalname
              : `${file.originalname}.pem`;

            callback(null, `${stationDir}/${fileName}`);
          } else if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
            const version = req.body.version || "CA1";
            const fileName = `AmazonRoot${version}.pem`;

            callback(null, `certificates/${fileName}`);
          } else {
            callback(new Error("Invalid Certificate Type"), "");
          }
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
      })
    : multer.diskStorage({
        destination: async (req, file, callback) => {
          const serial = req.body.serial;

          if (
            file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
            file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
          ) {
            const stationDir = path.join(CERTIFICATE_DIR, serial);

            if (!fs.existsSync(stationDir)) {
              fs.mkdirSync(stationDir, { recursive: true });
            }

            callback(null, stationDir);
          } else if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
            if (!fs.existsSync(CERTIFICATE_DIR)) {
              fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
            }
            callback(null, CERTIFICATE_DIR);
          } else {
            callback(new Error("Invalid Certificate Type"), "");
          }
        },
        filename: (req, file, callback) => {
          if (file.originalname.includes(CERTIFICATE_TYPES.ROOT_CA)) {
            const version = req.body.version || "CA1";
            const fileName = `AmazonRoot${version}.pem`;
            callback(null, fileName);
          } else {
            const fileName = file.originalname.includes(".pem.")
              ? file.originalname
              : `${file.originalname}.pem`;

            callback(null, fileName);
          }
        },
      });

export const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype === "application/x-pem-file" ||
      file.mimetype === "application/x-x509-ca-cert" ||
      file.mimetype === "text/plain" ||
      file.originalname.endsWith(".pem") ||
      file.originalname.endsWith(".crt") ||
      file.originalname.endsWith(".cer")
    ) {
      callback(null, true);
    } else {
      callback(null, false);
      return callback(new Error("Only PEM format certificates are allowed"));
    }
  },
});
