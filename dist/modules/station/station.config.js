"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationConfig = createStationConfig;
const path_1 = __importDefault(require("path"));
const aws_config_1 = require("../../config/aws.config");
function createStationConfig(props) {
    const certPath = path_1.default.join(process.cwd(), props.certPath);
    const keyPath = path_1.default.join(process.cwd(), props.keyPath);
    const caPath = props.caPath;
    return {
        stationName: props.stationName,
        stationId: props.stationId,
        certPath,
        keyPath,
        caPath,
        ...aws_config_1.DEFAULT_AWS_IOT_CONFIG,
    };
}
