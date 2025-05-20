import path from "path";
import fs from "fs";
import crypto from "crypto";
import { CERTIFICATE_DIR } from "../constants/certificate";

export const getCertificateDir = () => {
  const baseDir =
    process.env.NODE_ENV === "production"
      ? process.env.CERT_DIR || "/etc/ssl/private/station-certs"
      : path.join(__dirname, "../../../certificates");

  return baseDir;
};

export const normalizeVersion = (version: string | number): string => {
  return version.toString().toUpperCase().replace("CA", "");
};

export const formatVersion = (version: string): string => {
  return `CA${version}`;
};

export const getCertificatePath = (version: string): string => {
  const formattedVersion = formatVersion(version);
  const fileName = `AmazonRoot${formattedVersion}.pem`;
  return path.join(CERTIFICATE_DIR, fileName);
};

export const validateCertificate = (content: string): boolean => {
  return content.includes("BEGIN CERTIFICATE") && content.includes("END CERTIFICATE");
};

export const readCertificateFromFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

export const writeCertificateToFile = (content: string, filePath: string): Promise<void> => {
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
