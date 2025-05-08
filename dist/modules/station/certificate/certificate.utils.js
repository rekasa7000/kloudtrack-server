"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateFingerPrint = exports.writeCertificateToFile = exports.readCertificateFromFile = exports.validateCertificate = exports.getCertificatePath = exports.formatVersion = exports.normalizeVersion = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const certificate_constant_1 = require("./certificate.constant");
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
    return path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, fileName);
};
exports.getCertificatePath = getCertificatePath;
const validateCertificate = (content) => {
    return (content.includes("BEGIN CERTIFICATE") && content.includes("END CERTIFICATE"));
};
exports.validateCertificate = validateCertificate;
const readCertificateFromFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(filePath, "utf8", (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
};
exports.readCertificateFromFile = readCertificateFromFile;
const writeCertificateToFile = (content, filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile(filePath, content, "utf8", (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
};
exports.writeCertificateToFile = writeCertificateToFile;
const getCertificateFingerPrint = (content) => {
    return crypto_1.default.createHash("sha256").update(content).digest("hex");
};
exports.getCertificateFingerPrint = getCertificateFingerPrint;
