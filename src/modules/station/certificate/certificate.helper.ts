import fs from "fs";
import crypto from "crypto";
import multer from "multer";

import path from "path";
import { CERTIFICATE_DIR, CERTIFICATE_TYPES } from "./certificate.constant";

export const writeCertificateToFile = (
  content: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, "utf8", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const getCertificateFingerPrint = (content: string): string => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (
      file.fieldname === CERTIFICATE_TYPES.PRIVATE_KEY ||
      file.fieldname === CERTIFICATE_TYPES.CERTIFICATE ||
      file.fieldname.endsWith(".pem.key") ||
      file.fieldname.endsWith(".pem.crt")
    ) {
      const serial = req.body.serial;

      const stationDir = path.join(CERTIFICATE_DIR, serial);

      if (!fs.existsSync(stationDir)) {
        fs.mkdirSync(stationDir, { recursive: true });
      }

      callback(null, stationDir);
    } else if (file.fieldname === CERTIFICATE_TYPES.ROOT_CA) {
      if (!fs.existsSync(CERTIFICATE_DIR)) {
        fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
      }
      callback(null, CERTIFICATE_DIR);
    } else {
      callback(new Error("Invalid CertificateType"), "");
    }
  },
  filename: (req, file, callback) => {
    if (file.fieldname === CERTIFICATE_TYPES.ROOT_CA) {
      const version = req.body.version || "CA1";
      const fileName = `AmazonRoot${version}.pem`;
      callback(null, fileName);
    } else {
      const fileName = file.fieldname.includes(".pem.")
        ? file.fieldname
        : `${file.fieldname}.pem`;

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

export const validateCertificate = (content: string): boolean => {
  return (
    content.includes("BEGIN CERTIFICATE") && content.includes("END CERTIFICATE")
  );
};

export const readCertificateFromFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};
