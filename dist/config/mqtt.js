"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationConfig = createStationConfig;
const path_1 = __importDefault(require("path"));
function createStationConfig(stationId, certificateDir = "../../certificates", host = "a68bn74ibyvu1-ats.iot.ap-southeast-1.amazonaws.com") {
    return {
        keyPath: path_1.default.resolve(__dirname, `${certificateDir}/${stationId}/${stationId}-private.pem.key`),
        certPath: path_1.default.resolve(__dirname, `${certificateDir}/${stationId}/${stationId}-certificate.pem.crt`),
        caPath: path_1.default.resolve(__dirname, `${certificateDir}/AmazonRootCA1.pem`),
        clientId: `server-${stationId}-${Math.random()
            .toString(16)
            .substring(2, 10)}`,
        host: host,
        port: 8883,
        protocol: "mqtts",
        reconnectPeriod: 10000,
        stationId: stationId,
    };
}
