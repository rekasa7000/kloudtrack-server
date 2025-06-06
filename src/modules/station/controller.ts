import { Request, Response } from "express";
import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { sendResponse } from "../../core/utils/response";
import { AppError } from "../../core/utils/error";
import { StationService } from "./service";
import { CreateStationDTO, UpdateStationDTO } from "./type";

export class StationController {
  private service: StationService;

  constructor(stationService: StationService) {
    this.service = stationService;
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const skip = Number(req.query.skip as string);
    const take = Number(req.query.take as string);

    const stations = await this.service.getAllStations(skip, take);
    return sendResponse(res, stations, 200, "Stations fetched successfully");
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 400);

    const data: CreateStationDTO = req.body;
    const newStation = await this.service.createStation(data, req.user.id);

    return sendResponse(res, newStation, 201, "Station created successfully");
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data: UpdateStationDTO = req.body;
    const { id } = req.params;

    const updatedStation = await this.service.updateStation(+id, data);
    return sendResponse(res, updatedStation, 200, "Station updated successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deletedStation = await this.service.deleteStation(+id);
    return sendResponse(res, deletedStation, 200, "Station deleted successfully");
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await this.service.getStationById(+id);
    return sendResponse(res, station, 200, "Station fetched successfully");
  });

  activateStation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const station = await this.service.activateStation(+id);
    return sendResponse(res, station, 200, "Station fetched successfully");
  });
}
