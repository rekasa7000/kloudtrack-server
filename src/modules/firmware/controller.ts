import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { AppError } from "../../core/utils/error";
import { sendResponse } from "../../core/utils/response";
import { FirmwareService } from "./service";
import { Request, Response } from "express";

export class FirmwareController {
  private service: FirmwareService;
  constructor(firmwareService: FirmwareService) {
    this.service = firmwareService;
  }

  createFirmware = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 400);
    }

    if (!req.file) {
      throw new AppError("Firmware (.bin) file is required", 400);
    }

    if (!req.body.version) {
      throw new AppError("Version not specified", 400);
    }

    const { version, title, description } = req.body;
    const { id } = req.user;

    const result = await this.service.create(id, {
      title: title,
      description: description,
      serial: (req.file as any).serial,
      s3Key: (req.file as any).s3Key,
      version: (req.file as any).version || version,
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
    });

    return sendResponse(res, result, 201, "Amazon Root CA certificate uploaded successfully");
  });
  updateFirmware = asyncHandler(async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const id = +req.params.id;

    if (!title && !description) {
      throw new AppError("Please include the input in the request", 400);
    }

    const result = await this.service.update(id, { title, description });

    return sendResponse(res, result, 200, "Firmware metadata updated");
  });
  deleteFirmware = asyncHandler(async (req: Request, res: Response) => {
    const id = +req.params.id;

    const result = await this.service.delete(id);

    return sendResponse(res, result, 200, "Firmware deleted succesfully");
  });
  findFirmwareById = asyncHandler(async (req: Request, res: Response) => {
    const id = +req.params.id;

    const result = await this.service.findById(id);

    return sendResponse(res, result, 200, "Firmware fetched successfully");
  });
  findManyFirmware = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.findMany();

    return sendResponse(res, result, 200, "Firmware fetched successfully");
  });
}
