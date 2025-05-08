"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationConfig = createStationConfig;
const path_1 = __importDefault(require("path"));
const aws_config_1 = require("../../config/aws.config");
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
    console.log(CERT_DIR);
    console.log(certPath);
    return {
        stationName: props.stationName,
        stationId: props.stationId,
        certPath,
        keyPath,
        caPath,
        ...aws_config_1.DEFAULT_AWS_IOT_CONFIG,
    };
}
