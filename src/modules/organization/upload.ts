import multer from "multer";
import { Request, Response, NextFunction } from "express";

interface MulterRequest extends Request {
  body: {
    name?: string;
  };
  file?: Express.Multer.File & { s3Key?: string; name?: string };
}

export class OrganizationUpload {
  private storage: multer.StorageEngine;
  private imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  constructor() {
    this.storage = this.createStorageEngine();
  }

  private createStorageEngine(): multer.StorageEngine {
    return multer.memoryStorage();
  }

  private async generateS3Key(req: MulterRequest, file: Express.Multer.File): Promise<string> {
    if (!this.imageTypes.includes(file.mimetype)) {
      throw new Error("Invalid image type. Only image files are allowed.");
    }

    const name = req.body.name || "unnamed";
    return `organizations/${name}/${file.originalname}`;
  }

  public uploadOrganizationPicture() {
    const fileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
      if (this.imageTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
      }
    };

    const upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }).single("displayPicture");

    return async (req: MulterRequest, res: Response, next: NextFunction) => {
      upload(req, res, async (err: any) => {
        if (err) return next(err);

        if (!req.file) {
          return next();
        }

        try {
          const s3Key = await this.generateS3Key(req, req.file);

          req.file = {
            ...req.file,
            s3Key,
            name: req.body.name,
          } as any;

          next();
        } catch (error) {
          next(error);
        }
      });
    };
  }
}
