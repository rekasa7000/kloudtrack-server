import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import z from "zod";

export type CertificateType = "ROOT" | "THING_CERTIFICATE" | "PRIVATE_KEY";

export interface CertificateFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  type: CertificateType;
  content?: string;
}

export interface CertificateUploadRequest extends Request {
  certificates?: {
    rootCertificate?: CertificateFile;
    thingCertificate?: CertificateFile;
    privateKey?: CertificateFile;
  };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "certificates");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}`;
    const fileExt = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const validFields = ["rootCertificate", "thingCertificate", "privateKey"];
  if (!validFields.includes(file.fieldname)) {
    return cb(
      new Error(
        `Invalid field name: ${
          file.fieldname
        }. Must be one of: ${validFields.join(", ")}`
      )
    );
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "rootCertificate" && ext !== ".pem") {
    return cb(new Error("Root certificate must be a .pem file"));
  }

  if (file.fieldname === "thingCertificate" && ext !== ".crt") {
    return cb(new Error("Thing certificate must be a .crt file"));
  }

  if (file.fieldname === "privateKey" && ext !== ".key") {
    return cb(new Error("Private key must be a .key file"));
  }

  // Check mimetype (all should be text files)
  if (
    !file.mimetype.includes("text") &&
    file.mimetype !== "application/octet-stream" &&
    file.mimetype !== "application/x-x509-ca-cert"
  ) {
    return cb(new Error(`Invalid file type: ${file.mimetype}`));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024, // 1MB max file size
    files: 3, // Max 3 files at once
  },
});

export const certificateUploadMiddleware = (
  requiredFields: string[] = [
    "rootCertificate",
    "thingCertificate",
    "privateKey",
  ]
) => {
  const fields = requiredFields.map((field) => ({ name: field, maxCount: 1 }));
  const multerMiddleware = upload.fields(fields);

  return (req: CertificateUploadRequest, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Multer-specific errors
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
            code: err.code,
          });
        }
        // Other errors
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      for (const field of requiredFields) {
        if (!files[field] || files[field].length === 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required certificate file: ${field}`,
          });
        }
      }

      req.certificates = {};

      try {
        if (files.rootCertificate && files.rootCertificate[0]) {
          const rootFile = files.rootCertificate[0];
          const content = fs.readFileSync(rootFile.path, "utf8");

          if (
            !content.includes("BEGIN CERTIFICATE") ||
            !content.includes("END CERTIFICATE")
          ) {
            throw new Error("Invalid root certificate format");
          }

          const rootNameMatch = rootFile.originalname.match(
            /AmazonRoot(CA\d+)?\.pem/
          );
          if (!rootNameMatch) {
            throw new Error(
              "Root certificate filename must follow AmazonRootCA{version}.pem format"
            );
          }

          req.certificates.rootCertificate = {
            ...rootFile,
            type: "ROOT" as CertificateType,
            content,
          };
        }

        if (files.thingCertificate && files.thingCertificate[0]) {
          const certFile = files.thingCertificate[0];
          const content = fs.readFileSync(certFile.path, "utf8");

          if (
            !content.includes("BEGIN CERTIFICATE") ||
            !content.includes("END CERTIFICATE")
          ) {
            throw new Error("Invalid thing certificate format");
          }

          req.certificates.thingCertificate = {
            ...certFile,
            type: "THING_CERTIFICATE" as CertificateType,
            content,
          };
        }

        if (files.privateKey && files.privateKey[0]) {
          const keyFile = files.privateKey[0];
          const content = fs.readFileSync(keyFile.path, "utf8");

          if (
            !content.includes("BEGIN RSA PRIVATE KEY") &&
            !content.includes("BEGIN PRIVATE KEY")
          ) {
            throw new Error("Invalid private key format");
          }

          req.certificates.privateKey = {
            ...keyFile,
            type: "PRIVATE_KEY" as CertificateType,
            content,
          };
        }

        next();
      } catch (error) {
        Object.values(files).forEach((fileArray) =>
          fileArray.forEach((file) => fs.unlinkSync(file.path))
        );

        return res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Error processing certificate files",
        });
      }
    });
  };
};

// Zod schemas for certificate validation
export const rootCertificateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(false),
});

export const thingCertificateSchema = z.object({
  stationId: z.string().uuid(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
});

// Helper function to clean up files
export const cleanupCertificateFiles = (req: CertificateUploadRequest) => {
  if (!req.certificates) return;

  // Clean up root certificate file
  if (req.certificates.rootCertificate?.path) {
    try {
      fs.unlinkSync(req.certificates.rootCertificate.path);
    } catch (err) {
      console.error("Error deleting root certificate file:", err);
    }
  }

  // Clean up thing certificate file
  if (req.certificates.thingCertificate?.path) {
    try {
      fs.unlinkSync(req.certificates.thingCertificate.path);
    } catch (err) {
      console.error("Error deleting thing certificate file:", err);
    }
  }

  // Clean up private key file
  if (req.certificates.privateKey?.path) {
    try {
      fs.unlinkSync(req.certificates.privateKey.path);
    } catch (err) {
      console.error("Error deleting private key file:", err);
    }
  }
};
