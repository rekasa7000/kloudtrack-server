"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleCertificates = exports.uploadSingleCertificate = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const certificate_constant_1 = require("./certificate.constant");
const environment_config_1 = __importDefault(require("../../../config/environment.config"));
const aws_config_1 = require("../../../config/aws.config");
const sanitizer_1 = require("../../../core/utils/sanitizer");
const database_config_1 = __importDefault(require("../../../config/database.config"));
const storage = environment_config_1.default.NODE_ENV === "production"
    ? (0, multer_s3_1.default)({
        s3: aws_config_1.s3Client,
        bucket: aws_config_1.S3_BUCKET_NAME,
        key: async (req, file, callback) => {
            const serialCode = req.body.serialCode;
            if (!serialCode) {
                return callback(new Error("Serial Code not found"), "");
            }
            const station = await database_config_1.default.station.findUnique({
                where: {
                    serialCode,
                },
            });
            if (!station) {
                return callback(new Error("Station not found"), "");
            }
            const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
            const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(serialCode);
            if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY) ||
                file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE)) {
                const stationDir = `certificates/${namePart}_${sanitizedSerial}`;
                const fileName = file.originalname.includes(".pem.")
                    ? file.originalname
                    : `${file.originalname}.pem`;
                callback(null, `${stationDir}/${fileName}`);
            }
            else if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA)) {
                const version = req.body.version || "CA1";
                const fileName = `AmazonRoot${version}.pem`;
                callback(null, `certificates/${fileName}`);
            }
            else {
                callback(new Error("Invalid Certificate Type"), "");
            }
        },
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
    })
    : multer_1.default.diskStorage({
        destination: async (req, file, callback) => {
            const serialCode = req.body.serialCode;
            if (!serialCode) {
                return callback(new Error("Serial Code not found"), "");
            }
            const station = await database_config_1.default.station.findUnique({
                where: {
                    serialCode,
                },
            });
            if (!station) {
                return callback(new Error("Station not found"), "");
            }
            const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
            const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(serialCode);
            if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY) ||
                file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE)) {
                const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
                if (!fs_1.default.existsSync(stationDir)) {
                    fs_1.default.mkdirSync(stationDir, { recursive: true });
                }
                callback(null, stationDir);
            }
            else if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA)) {
                if (!fs_1.default.existsSync(certificate_constant_1.CERTIFICATE_DIR)) {
                    fs_1.default.mkdirSync(certificate_constant_1.CERTIFICATE_DIR, { recursive: true });
                }
                callback(null, certificate_constant_1.CERTIFICATE_DIR);
            }
            else {
                callback(new Error("Invalid Certificate Type"), "");
            }
        },
        filename: async (req, file, callback) => {
            const serialCode = req.body.serialCode;
            if (!serialCode) {
                return callback(new Error("Serial Code not found"), "");
            }
            const station = await database_config_1.default.station.findUnique({
                where: {
                    serialCode,
                },
            });
            if (!station) {
                return callback(new Error("Station not found"), "");
            }
            const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
            const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(serialCode);
            if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA)) {
                const version = req.body.version || "CA1";
                const fileName = `AmazonRoot${version}.pem`;
                callback(null, fileName);
            }
            else {
                let fileName = "";
                if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY)) {
                    fileName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY}`;
                }
                else if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE)) {
                    fileName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE}`;
                }
                callback(null, fileName);
            }
        },
    });
exports.uploadSingleCertificate = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, callback) => {
        callback(null, true);
    },
}).single("file");
exports.uploadMultipleCertificates = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, callback) => {
        callback(null, true);
    },
}).fields([
    { name: "key-file", maxCount: 1 },
    { name: "cert-file", maxCount: 1 },
]);
