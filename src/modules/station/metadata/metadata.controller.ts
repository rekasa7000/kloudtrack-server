import { Request, Response } from "express";
import { asyncHandler } from "../../../core/middlewares/error-handler.middleware";
import { AppError } from "../../../core/utils/error";
import prisma from "../../../config/database.config";
import { sendResponse } from "../../../core/utils/response";
import { StationMetadata } from "../station.type";

// * ALL STATIONS
export const getAllStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { skip, take } = req.query;

    if (!skip || !take) {
      throw new AppError("page and limit query should not empty", 400);
    }

    const allStations = await prisma.station.findMany({
      include: {
        certificate: true,
      },
      skip: +skip,
      take: +take,
      orderBy: {
        id: "asc",
      },
    });

    return sendResponse(res, allStations, 200, "Stations fetched successfully");
  }
);

// * CREATE STATION
export const createStation = asyncHandler(
  async (req: Request, res: Response) => {
    const data: StationMetadata = req.body;

    if (!data) {
      throw new AppError("Input required fields", 400);
    }

    const newStation = await prisma.station.create({
      data: {
        ...data,
      },
    });

    return sendResponse(res, newStation, 201, "Station created succesfully");
  }
);

// * UPDATE STATION
export const updateStation = asyncHandler(
  async (req: Request, res: Response) => {
    const data: StationMetadata = req.body;
    const { id } = req.params;

    if (!id) {
      throw new AppError("Id required fields", 400);
    }

    const updatedStation = await prisma.station.update({
      where: { id: +id },
      data: {
        ...data,
      },
    });

    return sendResponse(
      res,
      updatedStation,
      204,
      "Station created succesfully"
    );
  }
);

// * DELETE STATION
export const deleteStation = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Station Id not found", 400);
    }

    const deleteStation = await prisma.station.delete({
      where: { id: +id },
    });

    return sendResponse(
      res,
      deleteStation,
      200,
      "Station deleted successfully"
    );
  }
);

// * GET STATION BY ID
export const getStationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Station Id not found", 400);
    }

    const stationById = await prisma.station.findUnique({
      where: { id: +id },
    });

    return sendResponse(res, stationById, 200, "Station fetched successfully");
  }
);
