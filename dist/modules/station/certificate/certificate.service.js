"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const certificate_constant_1 = require("./certificate.constant");
const environment_config_1 = __importDefault(require("../../../config/environment.config"));
const aws_config_1 = require("../../../config/aws.config");
const storage = environment_config_1.default.NODE_ENV === "production"
    ? (0, multer_s3_1.default)({
        s3: aws_config_1.s3Client,
        bucket: aws_config_1.S3_BUCKET_NAME,
        key: (req, file, callback) => {
            const serial = req.body.serial;
            if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY) ||
                file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE)) {
                const stationDir = `certificates/${serial}`;
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
            const serial = req.body.serial;
            if (file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY) ||
                file.originalname.endsWith(certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE)) {
                const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, serial);
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
        filename: (req, file, callback) => {
            if (file.originalname.includes(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA)) {
                const version = req.body.version || "CA1";
                const fileName = `AmazonRoot${version}.pem`;
                callback(null, fileName);
            }
            else {
                const fileName = file.originalname.includes(".pem.")
                    ? file.originalname
                    : `${file.originalname}.pem`;
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
