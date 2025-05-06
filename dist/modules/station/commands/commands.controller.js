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
exports.sendCommand = sendCommand;
exports.getCommandHistory = getCommandHistory;
exports.getCommand = getCommand;
const commandsService = __importStar(require("./commands.service"));
const logger_1 = __importDefault(require("../../../core/utils/logger"));
const error_1 = require("../../../core/utils/error");
async function sendCommand(req, res) {
    try {
        const stationId = +req.params.stationId;
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ message: "Command is required" });
        }
        const validCommands = ["REBOOT", "CONFIGURE", "UPDATE", "STATUS", "CUSTOM"];
        if (!validCommands.includes(command)) {
            return res.status(400).json({
                message: `Invalid command. Must be one of: ${validCommands.join(", ")}`,
            });
        }
        if (!req.user) {
            throw new error_1.AppError("Not authenticated", 400);
        }
        const result = await commandsService.sendCommandService(command, req.user.id, stationId);
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error("Error sending command:", error);
        return res.status(500).json({
            message: "Failed to send command",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
async function getCommandHistory(req, res) {
    try {
        const stationId = +req.params.stationId;
        const { limit } = req.query;
        const recordLimit = limit ? parseInt(limit) : 50;
        if (isNaN(recordLimit) || recordLimit < 1) {
            return res.status(400).json({ message: "Invalid limit parameter" });
        }
        const commands = await commandsService.getCommandHistory(stationId, recordLimit);
        return res.status(200).json(commands);
    }
    catch (error) {
        logger_1.default.error("Error getting command history:", error);
        return res.status(500).json({
            message: "Failed to get command history",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
async function getCommand(req, res) {
    try {
        const commandId = +req.params.commandId;
        const command = await commandsService.getCommandById(commandId);
        return res.status(200).json(command);
    }
    catch (error) {
        logger_1.default.error("Error getting command:", error);
        if (error instanceof Error && error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Failed to get command",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
