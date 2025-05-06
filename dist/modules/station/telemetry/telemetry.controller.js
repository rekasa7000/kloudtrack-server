"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestTelemetry = getLatestTelemetry;
exports.getHistoricalTelemetry = getHistoricalTelemetry;
exports.getAggregatedTelemetry = getAggregatedTelemetry;
const telemetryService = __importStar(require("./telemetry.service"));
const logger_1 = __importDefault(require("../../../core/utils/logger"));
async function getLatestTelemetry(req, res) {
    try {
        const stationId = +req.params.stationId;
        const data = await telemetryService.getLatestTelemetry(stationId);
        if (!data) {
            return res
                .status(404)
                .json({ message: `No telemetry data found for station ${stationId}` });
        }
        return res.status(200).json(data);
    }
    catch (error) {
        logger_1.default.error("Error getting latest telemetry data:", error);
        return res
            .status(500)
            .json({ message: "Failed to retrieve telemetry data" });
    }
}
async function getHistoricalTelemetry(req, res) {
    try {
        const stationId = +req.params.stationId;
        const { startDate, endDate, limit } = req.query;
        const start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const recordLimit = limit ? parseInt(limit) : 100;
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }
        const data = await telemetryService.getHistoricalTelemetry(stationId, start, end, recordLimit);
        return res.status(200).json(data);
    }
    catch (error) {
        logger_1.default.error("Error getting historical telemetry data:", error);
        return res
            .status(500)
            .json({ message: "Failed to retrieve historical telemetry data" });
    }
}
async function getAggregatedTelemetry(req, res) {
    try {
        const { stationId } = req.params;
        const { startDate, endDate, interval } = req.query;
        const start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }
        const validInterval = interval === "hourly" || interval === "daily" || interval === "weekly"
            ? interval
            : "daily";
        const data = await telemetryService.getAggregatedTelemetry(stationId, start, end, validInterval);
        return res.status(200).json(data);
    }
    catch (error) {
        logger_1.default.error("Error getting aggregated telemetry data:", error);
        return res
            .status(500)
            .json({ message: "Failed to retrieve aggregated telemetry data" });
    }
}
