"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationConfig = void 0;
const path_1 = __importDefault(require("path"));
const certificate_config_1 = require("./certificate.config");
const environment_config_1 = __importDefault(require("./environment.config"));
const createStationConfig = (stationId, host = environment_config_1.default.AMAZON_HOST) => {
    return {
        keyPath: path_1.default.resolve(__dirname, `${certificate_config_1.CERTIFICATE_DIR}/${stationId}/${stationId}-private.pem.key`),
        certPath: path_1.default.resolve(__dirname, `${certificate_config_1.CERTIFICATE_DIR}/${stationId}/${stationId}-certificate.pem.crt`),
        caPath: path_1.default.resolve(__dirname, `${certificate_config_1.CERTIFICATE_DIR}/AmazonRootCA1.pem`),
        clientId: `server-${stationId}-${Math.random()
            .toString(16)
            .substring(2, 10)}`,
        host: host,
        port: 8883,
        protocol: "mqtts",
        reconnectPeriod: 10000,
        stationId: stationId,
    };
};
exports.createStationConfig = createStationConfig;
