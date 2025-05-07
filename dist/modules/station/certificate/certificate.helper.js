"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCertificateFromFile = exports.validateCertificate = exports.upload = exports.getCertificateFingerPrint = exports.writeCertificateToFile = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const certificate_constant_1 = require("./certificate.constant");
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
const storage = multer_1.default.diskStorage({
    destination: (req, file, callback) => {
        const serial = req.body.serial;
        if (file.fieldname === certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY ||
            file.fieldname === certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE ||
            file.fieldname.endsWith(".pem.key") ||
            file.fieldname.endsWith(".pem.crt")) {
            const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, serial);
            if (!fs_1.default.existsSync(stationDir)) {
                fs_1.default.mkdirSync(stationDir, { recursive: true });
            }
            callback(null, stationDir);
        }
        else if (file.fieldname === certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA) {
            if (!fs_1.default.existsSync(certificate_constant_1.CERTIFICATE_DIR)) {
                fs_1.default.mkdirSync(certificate_constant_1.CERTIFICATE_DIR, { recursive: true });
            }
            callback(null, certificate_constant_1.CERTIFICATE_DIR);
        }
        else {
            callback(new Error("Invalid CertificateType"), "");
        }
    },
    filename: (req, file, callback) => {
        if (file.fieldname === certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA) {
            const version = req.body.version || "CA1";
            const fileName = `AmazonRoot${version}.pem`;
            callback(null, fileName);
        }
        else {
            const fileName = file.fieldname.includes(".pem.")
                ? file.fieldname
                : `${file.fieldname}.pem`;
            callback(null, fileName);
        }
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, callback) => {
        if (file.mimetype === "application/x-pem-file" ||
            file.mimetype === "application/x-x509-ca-cert" ||
            file.mimetype === "text/plain" ||
            file.originalname.endsWith(".pem") ||
            file.originalname.endsWith(".crt") ||
            file.originalname.endsWith(".cer")) {
            callback(null, true);
        }
        else {
            callback(null, false);
            return callback(new Error("Only PEM format certificates are allowed"));
        }
    },
});
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
