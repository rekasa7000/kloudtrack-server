"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStationById = exports.deleteStation = exports.updateStation = exports.createStation = exports.getAllStations = void 0;
const error_handler_middleware_1 = require("../../../core/middlewares/error-handler.middleware");
const database_config_1 = __importDefault(require("../../../config/database.config"));
const response_1 = require("../../../core/utils/response");
// * ALL STATIONS
exports.getAllStations = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const skip = Number(req.query.skip);
    const take = Number(req.query.take);
    const allStations = await database_config_1.default.station.findMany({
        include: {
            certificate: true,
        },
        skip: skip,
        take: take,
        orderBy: {
            id: "asc",
        },
    });
    return (0, response_1.sendResponse)(res, allStations, 200, "Stations fetched successfully");
});
// * CREATE STATION
exports.createStation = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const newStation = await database_config_1.default.station.create({
        data: {
            ...data,
        },
    });
    return (0, response_1.sendResponse)(res, newStation, 201, "Station created succesfully");
});
// * UPDATE STATION
exports.updateStation = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const { id } = req.params;
    const updatedStation = await database_config_1.default.station.update({
        where: { id: +id },
        data: {
            ...data,
        },
    });
    return (0, response_1.sendResponse)(res, updatedStation, 200, "Station created succesfully");
});
// * DELETE STATION
exports.deleteStation = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const deleteStation = await database_config_1.default.station.delete({
        where: { id: +id },
    });
    return (0, response_1.sendResponse)(res, deleteStation, 200, "Station deleted successfully");
});
// * GET STATION BY ID
exports.getStationById = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const stationById = await database_config_1.default.station.findUnique({
        where: { id: +id },
    });
    return (0, response_1.sendResponse)(res, stationById, 200, "Station fetched successfully");
});
