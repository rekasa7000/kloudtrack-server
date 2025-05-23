import multer from "multer";
import { Request } from "express";
import { sanitizePathComponent } from "../../core/utils/sanitizer";

interface MulterRequest extends Request {
  body: {
    serialCode?: string;
  };
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export class StationCertificateUploadService {
  private storage: multer.StorageEngine;

  constructor() {
    this.storage = this.createStorageEngine();
  }

  private createStorageEngine(): multer.StorageEngine {
    return multer.memoryStorage();
  }

  private async generateS3Key(serialCode: string, file: Express.Multer.File): Promise<string> {
    const serial = await sanitizePathComponent(serialCode);
    const stationDir = `certificates/${serial}`;

    if (file.fieldname === "key-file" && file.originalname.endsWith("private.pem.key")) {
      return `${stationDir}/${serial}-private.pem.key`;
    } else if (file.fieldname === "cert-file" && file.originalname.endsWith("certificate.pem.crt")) {
      return `${stationDir}/${serial}-certificate.pem.crt`;
    } else {
      throw new Error("Invalid file field or certificate type");
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

    const upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }).fields([
      { name: "key-file", maxCount: 1 },
      { name: "cert-file", maxCount: 1 },
    ]);

    return async (req: MulterRequest, res: any, next: any) => {
      upload(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.body.serialCode) {
          return next(new Error("Missing serialCode in request body"));
        }

        const files = req.files || {};

        try {
          for (const fieldName of ["key-file", "cert-file"]) {
            const file = files[fieldName]?.[0];
            if (!file) continue;

            const s3Key = await this.generateS3Key(req.body.serialCode, file);

            file.key = s3Key;
          }

          next();
        } catch (error) {
          next(error);
        }
      });
    };
  }
}
