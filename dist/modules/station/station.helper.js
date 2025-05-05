"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStationExists = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const error_1 = require("../../core/utils/error");
const validateStationExists = async (lookup) => {
    const { serialCode, stationId, stationName } = lookup;
    const station = await database_config_1.default.station.findFirst({
        where: {
            ...(serialCode && { serialCode }),
            ...(stationName && { stationName }),
            ...(stationId && { id: stationId }),
        },
    });
    if (!station) {
        throw new error_1.AppError("Station not found with the given identifier(s)", 400);
    }
    return station;
};
exports.validateStationExists = validateStationExists;
