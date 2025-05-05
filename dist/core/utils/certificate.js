"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateDir = void 0;
const path_1 = __importDefault(require("path"));
const getCertificateDir = () => {
    const baseDir = process.env.NODE_ENV === "production"
        ? process.env.CERT_DIR || "/etc/ssl/private/station-certs"
        : path_1.default.join(__dirname, "../../../certificates");
    return baseDir;
};
exports.getCertificateDir = getCertificateDir;
