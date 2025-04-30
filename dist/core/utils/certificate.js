"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.getCertificateDir = void 0;
exports.generateKeyFileName = generateKeyFileName;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getCertificateDir = () => {
    const baseDir = process.env.NODE_ENV === "production"
        ? process.env.CERT_DIR || "/etc/ssl/private/station-certs"
        : path_1.default.join(__dirname, "../../../certificates");
    return baseDir;
};
exports.getCertificateDir = getCertificateDir;
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const stationId = req.body.id || "temp";
        const certDir = path_1.default.join(__dirname, "../../certificates", stationId);
        if (!fs_1.default.existsSync(certDir)) {
            fs_1.default.mkdirSync(certDir, { recursive: true });
        }
        cb(null, certDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.originalname.endsWith(".key") ||
        file.originalname.endsWith(".crt") ||
        file.originalname.endsWith(".pem")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only .key and .crt files are allowed"));
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 },
});
function generateKeyFileName(prefix = "key", identifier, extension = ".key") {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
    const idSegment = identifier ? `_${identifier}` : "";
    return `${prefix}_${timestamp}${idSegment}${extension}`;
}
