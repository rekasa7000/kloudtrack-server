"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestDeactivation = exports.requestActivation = exports.getStationById = exports.deleteStation = exports.updateStation = exports.createStation = exports.getAllStations = void 0;
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
const station_service_1 = require("./station.service");
// * ALL STATIONS
exports.getAllStations = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * CREATE STATION
exports.createStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPDATE STATION
exports.updateStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * DELETE STATION
exports.deleteStation = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * GET STATION BY ID
exports.getStationById = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * REQUEST ACTIVATION
exports.requestActivation = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    console.log(req.body);
    const { Key, id } = req.body;
    const stationId = id;
    const activationKey = Key;
    const activateStation = await station_service_1.StationService.requestActivation(stationId, activationKey);
    if (!activateStation) {
        return res.status(400).json({ message: "Activation failed" });
    }
    return res.status(200).json({ message: "Activation successful" });
});
// * REQUEST DEACTIVATION
exports.requestDeactivation = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { Key, id } = req.body;
    const stationId = id;
    const deactivationKey = Key;
    const deactivateStation = await station_service_1.StationService.requestDeactivation(stationId, deactivationKey);
    if (!deactivateStation) {
        return res.status(400).json({ message: "Deactivation failed" });
    }
    return res.status(200).json({ message: "Deactivation successful" });
});
