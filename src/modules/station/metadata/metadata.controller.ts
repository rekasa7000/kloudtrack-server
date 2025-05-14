import { Request, Response } from "express";
import { asyncHandler } from "../../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../../core/utils/response";
import { AppError } from "../../../core/utils/error";
import { MetadataService } from "./metadata.service";
import { StationMetadata } from "../station.types";

export class MetadataController {
  private metadataService: MetadataService;

  constructor() {
    this.metadataService = new MetadataService();
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const skip = Number(req.query.skip as string);
    const take = Number(req.query.take as string);

    const stations = await this.metadataService.getAllStations(skip, take);
    return sendResponse(res, stations, 200, "Stations fetched successfully");
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 400);

    const data: StationMetadata = req.body;
    const newStation = await this.metadataService.createStation(data, req.user.id);

    return sendResponse(res, newStation, 201, "Station created successfully");
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data: StationMetadata = req.body;
    const { id } = req.params;

    const updatedStation = await this.metadataService.updateStation(+id, data);
    return sendResponse(res, updatedStation, 200, "Station updated successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deletedStation = await this.metadataService.deleteStation(+id);
    return sendResponse(res, deletedStation, 200, "Station deleted successfully");
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await this.metadataService.getStationById(+id);
    return sendResponse(res, station, 200, "Station fetched successfully");
  });
}
