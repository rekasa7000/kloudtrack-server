"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationConfig = createStationConfig;
const path_1 = __importDefault(require("path"));
const DEFAULT_AWS_IOT_CONFIG = {
    host: process.env.AWS_IOT_HOST || "",
    port: parseInt(process.env.AWS_IOT_PORT || "8883"),
    protocol: process.env.AWS_IOT_PROTOCOL || "mqtts",
    reconnectPeriod: parseInt(process.env.AWS_IOT_RECONNECT_PERIOD || "5000"),
};
const CERT_DIR = process.env.CERT_DIR || path_1.default.join(process.cwd(), "certificates");
function createStationConfig(props) {
    const certPath = path_1.default.isAbsolute(props.certPath)
        ? props.certPath
        : path_1.default.join(CERT_DIR, props.certPath);
    const keyPath = path_1.default.isAbsolute(props.keyPath)
        ? props.keyPath
        : path_1.default.join(CERT_DIR, props.keyPath);
    const caPath = path_1.default.isAbsolute(props.caPath)
        ? props.caPath
        : path_1.default.join(CERT_DIR, props.caPath);
    return {
        stationName: props.stationName,
        stationId: props.stationId,
        certPath,
        keyPath,
        caPath,
        ...DEFAULT_AWS_IOT_CONFIG,
    };
}
