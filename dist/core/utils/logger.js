"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const fs_1 = __importDefault(require("fs"));
const environment_config_1 = __importDefault(require("../../config/environment.config"));
const logStream = fs_1.default.createWriteStream("./app.log", { flags: "a" });
const consoleTransport = pino_1.default.transport({
    target: "pino-pretty",
    options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
    },
});
const localTimeFormatter = {
    time: () => `,"time":"${new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        hour12: true,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })}"`,
};
const logger = (0, pino_1.default)({
    level: environment_config_1.default.NODE_ENV === "production" ? "info" : "debug",
    timestamp: localTimeFormatter.time,
    messageKey: "description",
}, pino_1.default.multistream([{ stream: logStream }, { stream: consoleTransport }]));
exports.default = logger;
