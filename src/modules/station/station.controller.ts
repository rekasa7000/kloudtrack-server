import { asyncHandler } from "../../core/middlewares/error-handler.middleware";
import { Request, Response } from "express";
import { StationService } from "./station.service";

// * ALL STATIONS
export const getAllStations = asyncHandler((req: Request, res: Response) => {});

// * CREATE STATION
export const createStation = asyncHandler((req: Request, res: Response) => {});

// * UPDATE STATION
export const updateStation = asyncHandler((req: Request, res: Response) => {});

// * DELETE STATION
export const deleteStation = asyncHandler((req: Request, res: Response) => {});

// * GET STATION BY ID
export const getStationById = asyncHandler((req: Request, res: Response) => {});

// * REQUEST ACTIVATION
export const requestActivation = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    
    const { Key, id } = req.body;

    const stationId = id;
    const activationKey = Key;

    const activateStation = await StationService.requestActivation(stationId, activationKey);
    if (!activateStation) {
        return res.status(400).json({ message: "Activation failed" });
    }
    return res.status(200).json({ message: "Activation successful" });
}
);  

// * REQUEST DEACTIVATION
export const requestDeactivation = asyncHandler(async (req: Request, res: Response) => {
    const { Key, id } = req.body;

    const stationId = id;
    const deactivationKey = Key;

    const deactivateStation = await StationService.requestDeactivation(stationId, deactivationKey);
    if (!deactivateStation) {
        return res.status(400).json({ message: "Deactivation failed" });
    }
    return res.status(200).json({ message: "Deactivation successful" });



});

