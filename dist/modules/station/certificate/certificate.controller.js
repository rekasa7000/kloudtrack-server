"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateByStationId = exports.deleteCertificate = exports.updateCertificate = exports.uploadCertificate = exports.getAllCertificates = exports.listRootCertificates = exports.activateRootCertificate = exports.deleteRootCertificate = exports.updateRootCertificate = exports.createRootCertificate = exports.getRootCertificate = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const database_config_1 = __importDefault(require("../../../config/database.config"));
const response_1 = require("../../../core/utils/response");
const error_handler_middleware_1 = require("../../../core/middlewares/error-handler.middleware");
const error_1 = require("../../../core/utils/error");
const station_helper_1 = require("../station.helper");
const certificate_helper_1 = require("./certificate.helper");
const certificate_utils_1 = require("./certificate.utils");
const sanitizer_1 = require("../../../core/utils/sanitizer");
const certificate_constant_1 = require("./certificate.constant");
// * GET ROOT CERTIFICATE
exports.getRootCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const rootCertificate = await database_config_1.default.rootCertificate.findFirst({
        where: { status: "ACTIVE" },
    });
    if (!rootCertificate) {
        throw new error_1.AppError("Amazon Root CA certificate record not found", 404);
    }
    const rootCAPath = rootCertificate.path.startsWith("/")
        ? rootCertificate.path
        : path_1.default.join(process.cwd(), rootCertificate.path);
    if (!fs_1.default.existsSync(rootCAPath)) {
        throw new error_1.AppError("Amazon Root CA certificate file not found", 404);
    }
    const rootCA = fs_1.default.readFileSync(rootCAPath, "utf8");
    return (0, response_1.sendResponse)(res, {
        id: rootCertificate.id,
        version: (0, certificate_utils_1.formatVersion)(rootCertificate.version),
        status: rootCertificate.status,
        rootCA,
    }, 200, "Amazon root certificate fetched successfully");
});
// * UPLOAD ROOT CERTIFICATE
exports.createRootCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const existingCertificate = await database_config_1.default.rootCertificate.findFirst({
        where: { status: "ACTIVE" },
    });
    if (req.body && req.body.certificateText) {
        const { certificateText, version = "CA1" } = req.body;
        if (!(0, certificate_helper_1.validateCertificate)(certificateText)) {
            throw new error_1.AppError("Invalid certificate format", 400);
        }
        if (!fs_1.default.existsSync(certificate_constant_1.CERTIFICATE_DIR)) {
            fs_1.default.mkdirSync(certificate_constant_1.CERTIFICATE_DIR, { recursive: true });
        }
        const normalizedVersion = (0, certificate_utils_1.normalizeVersion)(version);
        const fileName = `AmazonRoot${(0, certificate_utils_1.formatVersion)(normalizedVersion)}.pem`;
        const filePath = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, fileName);
        await (0, certificate_helper_1.writeCertificateToFile)(certificateText, filePath);
        const fingerprint = (0, certificate_helper_1.getCertificateFingerPrint)(certificateText);
        if (existingCertificate) {
            await database_config_1.default.rootCertificate.updateMany({
                where: { status: "ACTIVE" },
                data: { status: "INACTIVE" },
            });
        }
        const rootCertificate = await database_config_1.default.rootCertificate.create({
            data: {
                path: filePath,
                version: normalizedVersion,
                status: "ACTIVE",
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: rootCertificate.id,
            version: (0, certificate_utils_1.formatVersion)(rootCertificate.version),
            fingerprint,
        }, 201, "Amazon Root CA certificate created successfully");
    }
    // * FILE CERTIFICATE UPLOAD
    const uploadRootCA = certificate_helper_1.upload.single(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA);
    return uploadRootCA(req, res, async (err) => {
        if (err) {
            throw new error_1.AppError(err.message, 400);
        }
        if (!req.file) {
            throw new error_1.AppError("Root CA certificate file or certificate text is required", 400);
        }
        const { version = "CA1" } = req.body;
        const normalizedVersion = (0, certificate_utils_1.normalizeVersion)(version);
        const filePath = req.file.path;
        const certificateText = fs_1.default.readFileSync(filePath, "utf8");
        if (!(0, certificate_helper_1.validateCertificate)(certificateText)) {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            throw new error_1.AppError("Invalid certificate format", 400);
        }
        const fingerprint = (0, certificate_helper_1.getCertificateFingerPrint)(certificateText);
        if (existingCertificate) {
            await database_config_1.default.rootCertificate.updateMany({
                where: { status: "ACTIVE" },
                data: { status: "INACTIVE" },
            });
        }
        const rootCertificate = await database_config_1.default.rootCertificate.create({
            data: {
                path: filePath,
                version: normalizedVersion,
                status: "ACTIVE",
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: rootCertificate.id,
            version: (0, certificate_utils_1.formatVersion)(rootCertificate.version),
            fingerprint,
        }, 201, "Amazon Root CA certificate uploaded successfully");
    });
});
// * UPDATE ROOT CERTIFICATE
exports.updateRootCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new error_1.AppError("Certificate ID is required", 400);
    }
    const existingCertificate = await database_config_1.default.rootCertificate.findUnique({
        where: { id: +id },
    });
    if (!existingCertificate) {
        throw new error_1.AppError("Root certificate not found", 404);
    }
    if (req.body && req.body.certificateText) {
        const { certificateText, version } = req.body;
        if (!(0, certificate_helper_1.validateCertificate)(certificateText)) {
            throw new error_1.AppError("Invalid certificate format", 400);
        }
        if (!fs_1.default.existsSync(certificate_constant_1.CERTIFICATE_DIR)) {
            fs_1.default.mkdirSync(certificate_constant_1.CERTIFICATE_DIR, { recursive: true });
        }
        const normalizedVersion = version
            ? (0, certificate_utils_1.normalizeVersion)(version)
            : existingCertificate.version;
        const fileName = `AmazonRoot${(0, certificate_utils_1.formatVersion)(normalizedVersion)}.pem`;
        const filePath = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, fileName);
        if (fs_1.default.existsSync(existingCertificate.path) &&
            existingCertificate.path !== filePath) {
            fs_1.default.unlinkSync(existingCertificate.path);
        }
        await (0, certificate_helper_1.writeCertificateToFile)(certificateText, filePath);
        const updatedCertificate = await database_config_1.default.rootCertificate.update({
            where: { id: +id },
            data: {
                path: filePath,
                version: normalizedVersion,
                updatedAt: new Date(),
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: updatedCertificate.id,
            version: (0, certificate_utils_1.formatVersion)(updatedCertificate.version),
        }, 200, "Amazon Root CA certificate updated successfully");
    }
    // * FILE CERTIFICATE UPLOAD
    const uploadRootCA = certificate_helper_1.upload.single(certificate_constant_1.CERTIFICATE_TYPES.ROOT_CA);
    return uploadRootCA(req, res, async (err) => {
        if (err) {
            throw new error_1.AppError(err.message, 400);
        }
        if (!req.file) {
            throw new error_1.AppError("Root CA certificate file or certificate text is required", 400);
        }
        const { version } = req.body;
        const normalizedVersion = version
            ? (0, certificate_utils_1.normalizeVersion)(version)
            : existingCertificate.version;
        const filePath = req.file.path;
        const certificateText = fs_1.default.readFileSync(filePath, "utf8");
        if (!(0, certificate_helper_1.validateCertificate)(certificateText)) {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            throw new error_1.AppError("Invalid certificate format", 400);
        }
        if (fs_1.default.existsSync(existingCertificate.path) &&
            existingCertificate.path !== filePath) {
            fs_1.default.unlinkSync(existingCertificate.path);
        }
        const updatedCertificate = await database_config_1.default.rootCertificate.update({
            where: { id: +id },
            data: {
                path: filePath,
                version: normalizedVersion,
                updatedAt: new Date(),
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: updatedCertificate.id,
            version: (0, certificate_utils_1.formatVersion)(updatedCertificate.version),
        }, 200, "Amazon Root CA certificate updated successfully");
    });
});
// * DELETE ROOT CERTIFICATE
exports.deleteRootCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const id = +req.params.id;
    const existingCertificate = await database_config_1.default.rootCertificate.findUnique({
        where: { id: +id },
    });
    if (!existingCertificate) {
        throw new error_1.AppError("Root certificate not found", 404);
    }
    if (fs_1.default.existsSync(existingCertificate.path)) {
        fs_1.default.unlinkSync(existingCertificate.path);
    }
    await database_config_1.default.rootCertificate.delete({
        where: { id: id },
    });
    return (0, response_1.sendResponse)(res, null, 200, "Amazon Root CA certificate deleted successfully");
});
// * ACTIVATE ROOT CERTIFICATE
exports.activateRootCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new error_1.AppError("Certificate ID is required", 400);
    }
    const certificate = await database_config_1.default.rootCertificate.findUnique({
        where: { id: parseInt(id) },
    });
    if (!certificate) {
        throw new error_1.AppError("Root certificate not found", 404);
    }
    await database_config_1.default.rootCertificate.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "INACTIVE" },
    });
    const activatedCertificate = await database_config_1.default.rootCertificate.update({
        where: { id: +id },
        data: { status: "ACTIVE", updatedAt: new Date() },
    });
    return (0, response_1.sendResponse)(res, {
        id: activatedCertificate.id,
        version: (0, certificate_utils_1.formatVersion)(activatedCertificate.version),
        status: activatedCertificate.status,
    }, 200, "Amazon Root CA certificate activated successfully");
});
// * LIST ALL ROOT CERTIFICATES
exports.listRootCertificates = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const certificates = await database_config_1.default.rootCertificate.findMany({
        orderBy: { createdAt: "desc" },
    });
    const formattedCertificates = certificates.map((cert) => ({
        ...cert,
        version: (0, certificate_utils_1.formatVersion)(cert.version),
    }));
    return (0, response_1.sendResponse)(res, formattedCertificates, 200, "Root certificates fetched successfully");
});
// * ALL THING CERTIFICATES
exports.getAllCertificates = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const stationCertificates = await database_config_1.default.stationCertificate.findMany({
        select: {
            stationId: true,
            certPath: true,
            keyPath: true,
            status: true,
            expiresAt: true,
        },
    });
    const verifiedCertificates = stationCertificates.map((cert) => {
        const certExists = fs_1.default.existsSync(path_1.default.join(process.cwd(), cert.certPath));
        const keyExists = fs_1.default.existsSync(path_1.default.join(process.cwd(), cert.keyPath));
        return {
            stationId: cert.stationId,
            status: cert.status,
            expiresAt: cert.expiresAt,
            certificates: {
                certficate: certExists,
                privateKey: keyExists,
            },
        };
    });
    (0, response_1.sendResponse)(res, verifiedCertificates, 200, "All certificates fetched successfully");
});
// * UPLOAD THING CERTIFICATE
exports.uploadCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    if (req.body.certificateContent || req.body.privateKeyContent) {
        const { serialCode, certificateContent, privateKeyContent, certificateId, certificateArn, } = req.body;
        if (!serialCode) {
            throw new error_1.AppError("Station Serial is Required", 400);
        }
        const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(serialCode);
        if (sanitizedSerial !== serialCode) {
            throw new error_1.AppError("Invalid characters in serial code", 400);
        }
        if (!certificateContent || !privateKeyContent) {
            throw new error_1.AppError("Both Certificate content and private key content are required", 400);
        }
        const station = await (0, station_helper_1.validateStationExists)({ serialCode });
        const existingCert = await database_config_1.default.stationCertificate.findFirst({
            where: { stationId: station.id },
        });
        if (existingCert) {
            throw new error_1.AppError(`Certificate for station ${station.stationName} already exists`, 409);
        }
        const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
        const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
        if (!fs_1.default.existsSync(stationDir)) {
            fs_1.default.mkdirSync(stationDir, { recursive: true });
        }
        const certFileName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE}`;
        const keyFileName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY}`;
        const certPath = path_1.default.join(stationDir, certFileName);
        const keyPath = path_1.default.join(stationDir, keyFileName);
        await (0, certificate_helper_1.writeCertificateToFile)(certificateContent, certPath);
        await (0, certificate_helper_1.writeCertificateToFile)(privateKeyContent, keyPath);
        const fingerprint = (0, certificate_helper_1.getCertificateFingerPrint)(certificateContent);
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const certPathRelative = `/certificates/${sanitizedSerial}/${certFileName}`;
        const keyPathRelative = `/certificates/${sanitizedSerial}/${keyFileName}`;
        const createdCertificate = await database_config_1.default.stationCertificate.create({
            data: {
                stationId: station.id,
                certPath: certPathRelative,
                keyPath: keyPathRelative,
                awsCertId: certificateId || null,
                awsCertArn: certificateArn || null,
                status: "ACTIVE",
                expiresAt,
                fingerprint,
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: createdCertificate.id,
            stationId: createdCertificate.stationId,
            certificatePath: certPathRelative,
            privateKeyPath: keyPathRelative,
            certificateFileName: certFileName,
            privateKeyFileName: keyFileName,
            status: createdCertificate.status,
            expiresAt: createdCertificate.expiresAt,
        });
    }
    // * FILE THING CERTIFICATE UPLOAD
    const { serialCode, certificateId, certificateArn } = req.body;
    if (!serialCode) {
        throw new error_1.AppError("Station Serial is Required", 400);
    }
    const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(serialCode);
    if (sanitizedSerial !== serialCode) {
        throw new error_1.AppError("Invalid characters in serial code", 400);
    }
    const station = await (0, station_helper_1.validateStationExists)({ serialCode });
    const existingCert = await database_config_1.default.stationCertificate.findFirst({
        where: { stationId: station.id },
    });
    const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
    const certFieldName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.CERTIFICATE}`;
    const keyFieldName = `${namePart}_${sanitizedSerial}-${certificate_constant_1.CERTIFICATE_TYPES.PRIVATE_KEY}`;
    const uploadFields = [
        { name: certFieldName, maxCount: 1 },
        { name: keyFieldName, maxCount: 1 },
    ];
    const uploadFiles = certificate_helper_1.upload.fields(uploadFields);
    uploadFiles(req, res, async (err) => {
        if (err) {
            throw new error_1.AppError(err.message, 400);
        }
        const files = req.files;
        if (!files[certFieldName] || !files[keyFieldName]) {
            throw new error_1.AppError("Both certificate and private key files are required", 400);
        }
        if (existingCert) {
            throw new error_1.AppError(`Certificate for station ${station.stationName} already exists`, 409);
        }
        const certificateFile = fs_1.default.readFileSync(files[certFieldName][0].path);
        const fingerprint = crypto_1.default
            .createHash("sha256")
            .update(certificateFile)
            .digest("hex");
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const certPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${certFieldName}`;
        const keyPathRelative = `/certificates/${namePart}_${sanitizedSerial}/${keyFieldName}`;
        const createdCertificate = await database_config_1.default.stationCertificate.create({
            data: {
                stationId: station.id,
                certPath: certPathRelative,
                keyPath: keyPathRelative,
                awsCertId: certificateId || null,
                awsCertArn: certificateArn || null,
                status: "ACTIVE",
                expiresAt,
                fingerprint,
            },
        });
        return (0, response_1.sendResponse)(res, {
            id: createdCertificate.id,
            stationId: createdCertificate.stationId,
            certificatePath: certPathRelative,
            privateKeyPath: keyPathRelative,
            certificateFileName: certFieldName,
            privateKeyFileName: keyFieldName,
            status: createdCertificate.status,
            expiresAt: createdCertificate.expiresAt,
        });
    });
});
// * UPDATE THING CERTIFICATE
exports.updateCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const stationId = +req.params.stationId;
    if (!stationId) {
        throw new error_1.AppError(`Station Id is Required`, 400);
    }
    const station = await (0, station_helper_1.validateStationExists)({ stationId });
    const existingCert = await database_config_1.default.stationCertificate.findFirst({
        where: { stationId: station.id },
    });
    if (!existingCert) {
        throw new error_1.AppError(`Certificate for station ${station.stationName} not found`, 409);
    }
    if (req.body.certificateContent || req.body.privateKeyContent) {
        const { certificateContent, privateKeyContent, certificateId, certificateArn, status, } = req.body;
        const updateData = {};
        let certPathRelative = existingCert.certPath;
        let keyPathRelative = existingCert.keyPath;
        if (status) {
            if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(status)) {
                throw new error_1.AppError("Invalid status value. Must be ACTIVE, INACTIVE, or REVOKED", 400);
            }
            updateData.status = status;
        }
        if (certificateId) {
            updateData.certificateId = certificateId;
        }
        if (certificateArn) {
            updateData.certificateArn = certificateArn;
        }
        const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
        const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(station.serialCode);
        const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
        if (!fs_1.default.existsSync(stationDir)) {
            fs_1.default.mkdirSync(stationDir, { recursive: true });
        }
        if (certificateContent) {
            const certPath = path_1.default.join(process.cwd(), certPathRelative);
            await (0, certificate_helper_1.writeCertificateToFile)(certificateContent, certPath);
            updateData.fingerprint = (0, certificate_helper_1.getCertificateFingerPrint)(certificateContent);
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            updateData.expirationDate = expiresAt;
        }
        if (privateKeyContent) {
            const keyPath = path_1.default.join(process.cwd(), keyPathRelative);
            await (0, certificate_helper_1.writeCertificateToFile)(privateKeyContent, keyPath);
        }
        if (Object.keys(updateData).length === 0) {
            throw new error_1.AppError("No Updates Provided", 400);
        }
        const updatedCertificate = await database_config_1.default.stationCertificate.update({
            where: { stationId: stationId },
            data: updateData,
        });
        return (0, response_1.sendResponse)(res, {
            id: updatedCertificate.id,
            stationId: updatedCertificate.stationId,
            status: updatedCertificate.status,
            certificateId: updatedCertificate.awsCertId,
            certificateArn: updatedCertificate.awsCertArn,
            expiresAt: updatedCertificate.expiresAt,
            certificatePath: updatedCertificate.certPath,
            privateKeyPath: updatedCertificate.keyPath,
            updated: {
                certificate: !!certificateContent,
                privateKey: !!privateKeyContent,
                metadata: !!(certificateId || certificateArn || status),
            },
        }, 200, `Certificate for thing ${station.stationName} updated successfully`);
    }
    // * FILE THING CERTIFICATE UPDATE
    const { certificateId, certificateArn, status } = req.body;
    const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(station.serialCode);
    const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
    if (!fs_1.default.existsSync(stationDir)) {
        fs_1.default.mkdirSync(stationDir, { recursive: true });
    }
    const certFieldName = path_1.default.basename(existingCert.certPath);
    const keyFieldName = path_1.default.basename(existingCert.keyPath);
    const uploadFields = [
        { name: certFieldName, maxCount: 1 },
        { name: keyFieldName, maxCount: 1 },
    ];
    const uploadFiles = certificate_helper_1.upload.fields(uploadFields);
    uploadFiles(req, res, async (err) => {
        if (err) {
            throw new error_1.AppError(err.message, 400);
        }
        const files = req.files;
        if (!files[certFieldName] &&
            !files[keyFieldName] &&
            !certificateId &&
            !certificateArn &&
            !status) {
            throw new error_1.AppError("At least one field is required for update", 400);
        }
        const updateData = {};
        if (status) {
            if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(status)) {
                throw new error_1.AppError("Invalid status value. Must be ACTIVE, INACTIVE, or REVOKED", 400);
            }
            updateData.status = status;
        }
        if (certificateId) {
            updateData.certificateId = certificateId;
        }
        if (certificateArn) {
            updateData.certificateArn = certificateArn;
        }
        if (files[certFieldName]) {
            const certificateFile = fs_1.default.readFileSync(files[certFieldName][0].path);
            updateData.fingerprint = crypto_1.default
                .createHash("sha256")
                .update(certificateFile)
                .digest("hex");
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            updateData.expiresAt = expiresAt;
        }
        const updatedCertificate = await database_config_1.default.stationCertificate.update({
            where: { stationId: station.id },
            data: updateData,
        });
        return (0, response_1.sendResponse)(res, {
            id: updatedCertificate.id,
            stationId: updatedCertificate.stationId,
            status: updatedCertificate.status,
            certificateId: updatedCertificate.awsCertId,
            certificateArn: updatedCertificate.awsCertArn,
            expiresAt: updatedCertificate.expiresAt,
            certificatePath: updatedCertificate.certPath,
            privateKeyPath: updatedCertificate.keyPath,
            updated: {
                certificate: !!files[certFieldName],
                privateKey: !!files[keyFieldName],
                metadata: !!(certificateId || certificateArn || status),
            },
        }, 200, `Certificate for thing ${station.stationName} updated successfully`);
    });
});
// * DELETE CERTIFICATE
exports.deleteCertificate = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const stationId = +req.params.stationId;
    if (!stationId) {
        throw new error_1.AppError("Station id is required", 400);
    }
    const station = await (0, station_helper_1.validateStationExists)({ stationId });
    const existingCert = await database_config_1.default.stationCertificate.findUnique({
        where: { stationId: station.id },
    });
    if (!existingCert) {
        throw new error_1.AppError(`Certificate record for thing ${station.stationName} not found`, 404);
    }
    await database_config_1.default.stationCertificate.delete({
        where: { stationId: station.id },
    });
    const namePart = (0, sanitizer_1.sanitizePathComponent)(station.stationType.substring(0, 5).toUpperCase());
    const sanitizedSerial = (0, sanitizer_1.sanitizePathComponent)(station.serialCode);
    const stationDir = path_1.default.join(certificate_constant_1.CERTIFICATE_DIR, `${namePart}_${sanitizedSerial}`);
    if (fs_1.default.existsSync(stationDir)) {
        fs_1.default.rmSync(stationDir, { recursive: true, force: true });
    }
    (0, response_1.sendResponse)(res, null, 200, `Certificates for thing ${station.stationName} deleted successfully`);
});
// * GET CERTIFICATE BY Station Id
exports.getCertificateByStationId = (0, error_handler_middleware_1.asyncHandler)(async (req, res) => {
    const stationId = +req.params.stationId;
    if (!stationId) {
        throw new error_1.AppError("Station id is required", 400);
    }
    const station = await (0, station_helper_1.validateStationExists)({ stationId });
    const existingCert = await database_config_1.default.stationCertificate.findUnique({
        where: { stationId: station.id },
    });
    if (!existingCert) {
        throw new error_1.AppError(`Certificate record for thing ${station.stationName} not found`, 404);
    }
    const certificate = await database_config_1.default.stationCertificate.findUnique({
        where: { stationId: station.id },
    });
    if (!certificate) {
        throw new error_1.AppError(`Certificate record for station ${station.stationName} not found`, 404);
    }
    const certificatePath = path_1.default.join(process.cwd(), certificate.certPath);
    const privateKeyPath = path_1.default.join(process.cwd(), certificate.keyPath);
    const hasCertificate = fs_1.default.existsSync(certificatePath);
    const hasPrivateKey = fs_1.default.existsSync(privateKeyPath);
    if (!hasCertificate || !hasPrivateKey) {
        throw new error_1.AppError(`One or more required certificate files for station ${station.stationName} are missing`, 404);
    }
    const certificateContent = fs_1.default.readFileSync(certificatePath, "utf8");
    const privateKeyContent = fs_1.default.readFileSync(privateKeyPath, "utf8");
    return (0, response_1.sendResponse)(res, {
        id: certificate.id,
        stationId: certificate.stationId,
        status: certificate.status,
        expiresAt: certificate.expiresAt,
        certificateId: certificate.awsCertId,
        certificateArn: certificate.awsCertArn,
        certificate: certificateContent,
        privateKey: privateKeyContent,
    }, 200, "Certificate fetched successfull");
});
