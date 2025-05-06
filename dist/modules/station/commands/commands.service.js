"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCommandService = exports.getCommandById = exports.getCommandHistory = void 0;
const database_config_1 = __importDefault(require("../../../config/database.config"));
const logger_1 = __importDefault(require("../../../core/utils/logger"));
const telemetry_mqtt_1 = __importDefault(require("../telemetry/telemetry.mqtt"));
const getCommandHistory = async (stationId, limit = 50) => {
    try {
        const commands = await database_config_1.default.command.findMany({
            where: {
                stationId: stationId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });
        return commands.map((cmd) => ({
            ...cmd,
            command: typeof cmd.command === "string"
                ? JSON.parse(cmd.command)
                : typeof cmd.command === "object"
                    ? cmd.command
                    : null,
        }));
    }
    catch (error) {
        logger_1.default.error(`Failed to get command history for station ${stationId}:`, error);
        throw error;
    }
};
exports.getCommandHistory = getCommandHistory;
const getCommandById = async (commandId) => {
    try {
        const command = await database_config_1.default.command.findUnique({
            where: {
                id: commandId,
            },
        });
        if (!command) {
            throw new Error(`Command ${commandId} not found`);
        }
        return {
            ...command,
            command: typeof command.command === "string"
                ? JSON.parse(command.command)
                : typeof command.command === "object"
                    ? command.command
                    : null,
        };
    }
    catch (error) {
        logger_1.default.error(`Failed to get command ${commandId}:`, error);
        throw error;
    }
};
exports.getCommandById = getCommandById;
const sendCommandService = async (command, userId, stationId) => {
    try {
        const station = await database_config_1.default.station.findUnique({
            where: { id: stationId },
            select: { serialCode: true },
        });
        if (!station) {
            throw new Error(`Station ${stationId} not found`);
        }
        await telemetry_mqtt_1.default.publish(`/kloudtrack/${station.serialCode}/command`, {
            command: { command },
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to send command ${stationId}:`, error);
        throw error;
    }
};
exports.sendCommandService = sendCommandService;
