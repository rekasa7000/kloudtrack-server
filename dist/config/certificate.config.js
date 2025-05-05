"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_CA_VERSIONS = exports.CERTIFICATE_DIR = exports.CERTIFICATE_TYPES = void 0;
const path_1 = __importDefault(require("path"));
const environment_config_1 = __importDefault(require("./environment.config"));
exports.CERTIFICATE_TYPES = {
    PRIVATE_KEY: "private.pem.key",
    CERTIFICATE: "certificate.pem.key",
    ROOT_CA: "AmazonRootCA1.pem",
};
exports.CERTIFICATE_DIR = environment_config_1.default.NODE_ENV === "production"
    ? environment_config_1.default.CERT_DIR || "/etc/ssl/private/station-certs"
    : path_1.default.join(__dirname, "../../../certificates");
exports.ROOT_CA_VERSIONS = {
    CA1: "AmazonRootCA1.pem",
    CA2: "AmazonRootCA2.pem",
    CA3: "AmazonRootCA3.pem",
    CA4: "AmazonRootCA4.pem",
};
