"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CERTIFICATE_TYPES = exports.CERTIFICATE_DIR = exports.VERSION_PATTERN = exports.CERTIFICATE_STATUSES = void 0;
const path_1 = __importDefault(require("path"));
const environment_config_1 = __importDefault(require("../../../config/environment.config"));
exports.CERTIFICATE_STATUSES = ["ACTIVE", "INACTIVE", "REVOKED"];
exports.VERSION_PATTERN = /^CA\d+$/i;
exports.CERTIFICATE_DIR = environment_config_1.default.NODE_ENV === "production"
    ? environment_config_1.default.CERT_DIR || "/etc/ssl/private/station-certs"
    : path_1.default.join(__dirname, "../../../../certificates");
exports.CERTIFICATE_TYPES = {
    PRIVATE_KEY: "private.pem.key",
    CERTIFICATE: "certificate.pem.crt",
    ROOT_CA: ".pem",
};
