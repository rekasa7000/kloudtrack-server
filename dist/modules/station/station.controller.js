"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStationById = exports.deleteStation = exports.updateStation = exports.createStation = exports.getAllStations = void 0;
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
const error_1 = require("../../core/utils/error");
const database_config_1 = __importDefault(require("../../config/database.config"));
// * ALL STATIONS
exports.getAllStations = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    if (!page && !limit) {
        throw new error_1.AppError("page and limit query should not empty", 400);
    }
    const allStations = await database_config_1.default.station.findMany({
        include: {
            certificate: true,
        },
    });
});
// * CREATE STATION
exports.createStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPDATE STATION
exports.updateStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * DELETE STATION
exports.deleteStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * GET STATION BY ID
exports.getStationById = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
