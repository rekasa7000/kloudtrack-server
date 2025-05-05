"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificatePath = exports.formatVersion = exports.normalizeVersion = void 0;
const path_1 = __importDefault(require("path"));
const certificate_config_1 = require("../../../config/certificate.config");
const normalizeVersion = (version) => {
    return version.toString().toUpperCase().replace("CA", "");
};
exports.normalizeVersion = normalizeVersion;
const formatVersion = (version) => {
    return `CA${version}`;
};
exports.formatVersion = formatVersion;
const getCertificatePath = (version) => {
    const formattedVersion = (0, exports.formatVersion)(version);
    const fileName = `AmazonRoot${formattedVersion}.pem`;
    return path_1.default.join(certificate_config_1.CERTIFICATE_DIR, fileName);
};
exports.getCertificatePath = getCertificatePath;
