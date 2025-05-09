"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRootCertificate = exports.updateRootCertificate = exports.uploadRootCertificate = exports.getRootCertificate = exports.getCertificateByStationId = exports.deleteCertificate = exports.updateCertificate = exports.uploadCertificate = exports.getAllCertificates = void 0;
const error_handler_middleware_1 = require("../../core/middlewares/error-handler.middleware");
// * ALL CERTIFICATES
exports.getAllCertificates = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPLOAD ROOT CERTIFICATE
exports.uploadCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPDATE CERTIFICATE
exports.updateCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * DELETE CERTIFICATE
exports.deleteCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * GET CERTIFICATE BY Station Id
exports.getCertificateByStationId = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * GET ROOT CERTIFICATE
exports.getRootCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPLOAD ROOT CERTIFICATE
exports.uploadRootCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * UPDATE ROOT CERTIFICATE
exports.updateRootCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
// * DELETE ROOT CERTIFICATE
exports.deleteRootCertificate = (0, error_handler_middleware_1.asyncHandler)((req, res) => { });
