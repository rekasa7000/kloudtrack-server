"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = require("./certificate.controller");
const validation_middleware_1 = require("../../../core/middlewares/validation.middleware");
const certificate_schema_1 = require("./certificate.schema");
const certificate_service_1 = require("./certificate.service");
const router = (0, express_1.Router)();
const rootCertificateRoute = "/root";
const certificateRoute = "/:stationId";
// *** AMAZON ROOT CERTIFICATE ***
// Get all root certificate
router.get(rootCertificateRoute, certificate_controller_1.listRootCertificates);
// Get Root Certificate
router.get(`${rootCertificateRoute}/:id`, certificate_controller_1.getRootCertificate);
// Upload Root Certificate
router.post(rootCertificateRoute, certificate_service_1.uploadSingleCertificate, (0, validation_middleware_1.validateRequest)(certificate_schema_1.createRootCertificateSchema), certificate_controller_1.createRootCertificate);
// Update Root Certificate
router.put(`${rootCertificateRoute}/:id`, certificate_service_1.uploadSingleCertificate, (0, validation_middleware_1.validateRequest)(certificate_schema_1.updateRootCertificateSchema), certificate_controller_1.updateRootCertificate);
// Delete Root Certificate
router.delete(`${rootCertificateRoute}/:id`, (0, validation_middleware_1.validateRequest)(certificate_schema_1.deleteRootCertificateSchema), certificate_controller_1.deleteRootCertificate);
// Activate Root Certificate
router.post(`${rootCertificateRoute}/:id`, (0, validation_middleware_1.validateRequest)(certificate_schema_1.activateRootCertificateSchema), certificate_controller_1.activateRootCertificate);
// *** CERTIFICATE PER STATIONS ***
// Upload Certificate
router.post(certificateRoute, certificate_service_1.uploadMultipleCertificates, (0, validation_middleware_1.validateRequest)(certificate_schema_1.uploadCertificateSchema), certificate_controller_1.uploadCertificate);
// Update Certificate
router.put(certificateRoute, certificate_service_1.uploadMultipleCertificates, (0, validation_middleware_1.validateRequest)(certificate_schema_1.updateCertificateSchema), certificate_controller_1.updateCertificate);
// Delete Certificate
router.delete(certificateRoute, (0, validation_middleware_1.validateRequest)(certificate_schema_1.stationIdSchema), certificate_controller_1.deleteCertificate);
// Get Certificate by Station ID
router.get(certificateRoute, (0, validation_middleware_1.validateRequest)(certificate_schema_1.stationIdSchema), certificate_controller_1.getCertificateByStationId);
exports.default = router;
