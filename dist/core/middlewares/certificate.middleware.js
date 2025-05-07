"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupCertificateFiles = exports.thingCertificateSchema = exports.rootCertificateSchema = exports.certificateUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = __importDefault(require("zod"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), "uploads", "certificates");
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto_1.default
            .randomBytes(6)
            .toString("hex")}`;
        const fileExt = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
    },
});
const fileFilter = (req, file, cb) => {
    const validFields = ["rootCertificate", "thingCertificate", "privateKey"];
    if (!validFields.includes(file.fieldname)) {
        return cb(new Error(`Invalid field name: ${file.fieldname}. Must be one of: ${validFields.join(", ")}`));
    }
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (file.fieldname === "rootCertificate" && ext !== ".pem") {
        return cb(new Error("Root certificate must be a .pem file"));
    }
    if (file.fieldname === "thingCertificate" && ext !== ".crt") {
        return cb(new Error("Thing certificate must be a .crt file"));
    }
    if (file.fieldname === "privateKey" && ext !== ".key") {
        return cb(new Error("Private key must be a .key file"));
    }
    // Check mimetype (all should be text files)
    if (!file.mimetype.includes("text") &&
        file.mimetype !== "application/octet-stream" &&
        file.mimetype !== "application/x-x509-ca-cert") {
        return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024, // 1MB max file size
        files: 3, // Max 3 files at once
    },
});
const certificateUploadMiddleware = (requiredFields = [
    "rootCertificate",
    "thingCertificate",
    "privateKey",
]) => {
    const fields = requiredFields.map((field) => ({ name: field, maxCount: 1 }));
    const multerMiddleware = upload.fields(fields);
    return (req, res, next) => {
        multerMiddleware(req, res, async (err) => {
            if (err) {
                if (err instanceof multer_1.default.MulterError) {
                    // Multer-specific errors
                    return res.status(400).json({
                        success: false,
                        message: `Upload error: ${err.message}`,
                        code: err.code,
                    });
                }
                // Other errors
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            }
            const files = req.files;
            if (!files || Object.keys(files).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files uploaded",
                });
            }
            for (const field of requiredFields) {
                if (!files[field] || files[field].length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing required certificate file: ${field}`,
                    });
                }
            }
            req.certificates = {};
            try {
                if (files.rootCertificate && files.rootCertificate[0]) {
                    const rootFile = files.rootCertificate[0];
                    const content = fs_1.default.readFileSync(rootFile.path, "utf8");
                    if (!content.includes("BEGIN CERTIFICATE") ||
                        !content.includes("END CERTIFICATE")) {
                        throw new Error("Invalid root certificate format");
                    }
                    const rootNameMatch = rootFile.originalname.match(/AmazonRoot(CA\d+)?\.pem/);
                    if (!rootNameMatch) {
                        throw new Error("Root certificate filename must follow AmazonRootCA{version}.pem format");
                    }
                    req.certificates.rootCertificate = {
                        ...rootFile,
                        type: "ROOT",
                        content,
                    };
                }
                if (files.thingCertificate && files.thingCertificate[0]) {
                    const certFile = files.thingCertificate[0];
                    const content = fs_1.default.readFileSync(certFile.path, "utf8");
                    if (!content.includes("BEGIN CERTIFICATE") ||
                        !content.includes("END CERTIFICATE")) {
                        throw new Error("Invalid thing certificate format");
                    }
                    req.certificates.thingCertificate = {
                        ...certFile,
                        type: "THING_CERTIFICATE",
                        content,
                    };
                }
                if (files.privateKey && files.privateKey[0]) {
                    const keyFile = files.privateKey[0];
                    const content = fs_1.default.readFileSync(keyFile.path, "utf8");
                    if (!content.includes("BEGIN RSA PRIVATE KEY") &&
                        !content.includes("BEGIN PRIVATE KEY")) {
                        throw new Error("Invalid private key format");
                    }
                    req.certificates.privateKey = {
                        ...keyFile,
                        type: "PRIVATE_KEY",
                        content,
                    };
                }
                next();
            }
            catch (error) {
                Object.values(files).forEach((fileArray) => fileArray.forEach((file) => fs_1.default.unlinkSync(file.path)));
                return res.status(400).json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Error processing certificate files",
                });
            }
        });
    };
};
exports.certificateUploadMiddleware = certificateUploadMiddleware;
// Zod schemas for certificate validation
exports.rootCertificateSchema = zod_1.default.object({
    name: zod_1.default.string().min(3).max(100),
    description: zod_1.default.string().optional(),
    isActive: zod_1.default.boolean().optional().default(false),
});
exports.thingCertificateSchema = zod_1.default.object({
    stationId: zod_1.default.string().uuid(),
    name: zod_1.default.string().min(3).max(100).optional(),
    description: zod_1.default.string().optional(),
});
// Helper function to clean up files
const cleanupCertificateFiles = (req) => {
    if (!req.certificates)
        return;
    // Clean up root certificate file
    if (req.certificates.rootCertificate?.path) {
        try {
            fs_1.default.unlinkSync(req.certificates.rootCertificate.path);
        }
        catch (err) {
            console.error("Error deleting root certificate file:", err);
        }
    }
    // Clean up thing certificate file
    if (req.certificates.thingCertificate?.path) {
        try {
            fs_1.default.unlinkSync(req.certificates.thingCertificate.path);
        }
        catch (err) {
            console.error("Error deleting thing certificate file:", err);
        }
    }
    // Clean up private key file
    if (req.certificates.privateKey?.path) {
        try {
            fs_1.default.unlinkSync(req.certificates.privateKey.path);
        }
        catch (err) {
            console.error("Error deleting private key file:", err);
        }
    }
};
exports.cleanupCertificateFiles = cleanupCertificateFiles;
