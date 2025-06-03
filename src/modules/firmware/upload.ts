import multer from "multer";
import { Request } from "express";
import { formatVersion, normalizeVersion } from "../../core/utils/certificate";

interface MulterRequest extends Request {
  body: {
    version?: string;
  };
}

export class FirmwareUploadService {
  private storage: multer.StorageEngine;

  constructor() {
    this.storage = this.createStorageEngine();
  }

  private createStorageEngine(): multer.StorageEngine {
    return multer.memoryStorage();
  }

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File): Promise<string> {
    if (!file.originalname.endsWith(".bin")) {
      throw new Error("Invalid Firmware Type - Only .bin files are allowed");
    }

    const version = req.body.version;

    return `firmware/${version}/firmware.bin`;
  }

  private generateFirmwareSerial(version: string): string {
    return `kt-firmware-${version}`;
  }

  public uploadFirmware() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (file.originalname.endsWith(".bin")) {
        callback(null, true);
      } else {
        callback(new Error("Only .bin firmware files are allowed"));
      }
    };

    const upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }).single("firmware");

    return async (req: MulterRequest, res: any, next: any) => {
      upload(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          return next(new Error("No file uploaded"));
        }

        try {
          const version = req.body.version || "v0.0.0";
          const s3Key = await this.generateS3Key(req, req.file);
          const serial = this.generateFirmwareSerial(version);

          req.file = {
            ...req.file,
            s3Key: s3Key,
            serial: serial,
            version: version,
          } as any;

          next();
        } catch (error) {
          next(error);
        }
      });
    };
  }
}
