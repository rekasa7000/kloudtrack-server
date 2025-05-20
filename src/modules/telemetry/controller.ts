import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { Request, Response } from "express";
import { TelemetryService } from "./service";
import { Prisma } from "@prisma/client";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";

export class TelemetryController {
  private service: TelemetryService;

  constructor(telemetryService: TelemetryService) {
    this.service = telemetryService;
  }

  saveTelemetry = asyncHandler(async (req: Request, res: Response) => {
    const data: Prisma.TelemetryUncheckedCreateInput = req.body;

    const telemetry = await this.service.createTelemetry(data);

    return sendResponse(res, undefined, 400, `Weather data saved successfully on ${telemetry.station.stationName}`);
  });

  updateTelemetry = asyncHandler(async (req: Request, res: Response) => {
    const data: Prisma.TelemetryUncheckedUpdateInput = req.body;
    const id = req.params.id;

    const telemetry = await this.service.updateTelemetry(+id, data);

    return sendResponse(res, undefined, 400, `Weather data updated successfully on ${telemetry.station.stationName}`);
  });

  deleteTelemetry = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const telemetry = await this.service.deleteTelemetry(+id);

    return sendResponse(res, undefined, 400, `Weather data deleted successfully on ${telemetry.station.stationName}`);
  });

  findTelemetryById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const telemetry = await this.service.findById(+id);

    if (!telemetry) {
      throw new AppError("Weather data not found", 404);
    }

    return sendResponse(res, undefined, 400, `Weather data deleted successfully on ${telemetry.station.stationName}`);
  });

  findManyTelemetry = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const skip = Number(req.query.skip as string);
    const take = Number(req.query.take as string);

    const telemetry = await this.service.findManyTelemetry(+id, take, skip);

    if (!telemetry) {
      throw new AppError("Weather data not found", 404);
    }

    return sendResponse(res, undefined, 400, `Weather data deleted successfully on ${telemetry.station.stationName}`);
  });
}
