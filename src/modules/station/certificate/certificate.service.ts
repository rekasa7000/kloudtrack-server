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
    serialCode?: string;
    version?: string;
  };
}

const storage =
  config.NODE_ENV === "production"
    ? multerS3({
        s3: s3Client,
        bucket: S3_BUCKET_NAME,
        key: async (req: MulterRequest, file, callback) => {
          const serialCode = req.body.serialCode;

          if (!serialCode) {
            return callback(new Error("Serial Code not found"), "");
          }
          const station = await prisma.station.findUnique({
            where: {
              serialCode,
            },
          });

          if (!station) {
            return callback(new Error("Station not found"), "");
          }
          const namePart = sanitizePathComponent(
            station.stationType.substring(0, 5).toUpperCase()
          );

          const sanitizedSerial = sanitizePathComponent(serialCode);

          if (
            file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
            file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
          ) {
            const stationDir = `certificates/${namePart}_${sanitizedSerial}`;
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
          const serialCode = req.body.serialCode;
          if (!serialCode) {
            return callback(new Error("Serial Code not found"), "");
          }
          const station = await prisma.station.findUnique({
            where: {
              serialCode,
            },
          });

          if (!station) {
            return callback(new Error("Station not found"), "");
          }
          const namePart = sanitizePathComponent(
            station.stationType.substring(0, 5).toUpperCase()
          );

          const sanitizedSerial = sanitizePathComponent(serialCode);

          if (
            file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY) ||
            file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
          ) {
            const stationDir = path.join(
              CERTIFICATE_DIR,
              `${namePart}_${sanitizedSerial}`
            );
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
        filename: async (req, file, callback) => {
          const serialCode = req.body.serialCode;
          if (!serialCode) {
            return callback(new Error("Serial Code not found"), "");
          }
          const station = await prisma.station.findUnique({
            where: {
              serialCode,
            },
          });

          if (!station) {
            return callback(new Error("Station not found"), "");
          }
          const namePart = sanitizePathComponent(
            station.stationType.substring(0, 5).toUpperCase()
          );

          const sanitizedSerial = sanitizePathComponent(serialCode);

          if (file.originalname.endsWith(CERTIFICATE_TYPES.ROOT_CA)) {
            const version = req.body.version || "CA1";
            const fileName = `AmazonRoot${version}.pem`;
            callback(null, fileName);
          } else {
            let fileName = "";
            if (file.originalname.endsWith(CERTIFICATE_TYPES.PRIVATE_KEY)) {
              fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.PRIVATE_KEY}`;
            } else if (
              file.originalname.endsWith(CERTIFICATE_TYPES.CERTIFICATE)
            ) {
              fileName = `${namePart}_${sanitizedSerial}-${CERTIFICATE_TYPES.CERTIFICATE}`;
            }
            callback(null, fileName);
          }
        },
      });

export const uploadSingleCertificate = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    callback(null, true);
  },
}).single("file");

export const uploadMultipleCertificates = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    callback(null, true);
  },
}).fields([
  { name: "key-file", maxCount: 1 },
  { name: "cert-file", maxCount: 1 },
]);
